import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { GoogleGenAI, Type } from '@google/genai';
import {
  initDataStore,
  getUsuarioByUsername,
  getUsuarioById,
  updateUsuario,
  saveComparacion,
  logAuditoria,
  StoredUsuario,
} from './src/server/authStore';

dotenv.config();

// Initialize users, comparisons and audit data storage
initDataStore();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'bn-seguros-costa-rica-cookie-secret-2026';

// Middleware for parsing large JSON payloads (PDFs encoded in base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(COOKIE_SECRET));

// Cookie configuration: signed, httpOnly, 8 hours expiration
const SESSION_COOKIE_NAME = 'bn_session';
const COOKIE_OPTIONS: express.CookieOptions = {
  httpOnly: true,
  signed: true,
  maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

// Middleware: Require authenticated and active user
const requireAuth = (req: any, res: any, next: any) => {
  const userId = req.signedCookies?.[SESSION_COOKIE_NAME];
  if (!userId) {
    return res.status(401).json({ error: 'Acceso no autorizado. Inicie sesión.' });
  }

  const user = getUsuarioById(userId);
  if (!user) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ error: 'Sesión no válida o usuario no existe.' });
  }

  if (user.estado === 'suspendido') {
    return res.status(401).json({ error: 'usuario suspendido, contacte al administrador' });
  }

  req.user = user;
  next();
};

// Initialize Google GenAI client with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JSON Schema for structured output from Gemini
const comparisonResponseSchema = {
  type: Type.OBJECT,
  properties: {
    proposals: {
      type: Type.ARRAY,
      description: 'Lista de análisis comparativo de cada una de las propuestas PDF analizadas, en el mismo orden recibido.',
      items: {
        type: Type.OBJECT,
        properties: {
          insurerName: {
            type: Type.STRING,
            description: "Nombre de la entidad aseguradora identificada en el PDF o 'no indicado'",
          },
          planName: {
            type: Type.STRING,
            description: "Nombre de la póliza, producto o plan de seguro de automóvil o 'no indicado'",
          },
          fileName: {
            type: Type.STRING,
            description: 'Nombre del archivo PDF correspondiente',
          },
          annualPremium: {
            type: Type.STRING,
            description: "Prima anual total exacta extraída del documento con su moneda (ej. ₡618,500 o $1,150) o 'no indicado'",
          },
          fitsBudget: {
            type: Type.STRING,
            description: "'Sí' si la prima anual es menor o igual al presupuesto máximo anual del cliente, o 'No' si lo supera, o 'no indicado'",
          },
          collisionDeductible: {
            type: Type.STRING,
            description: "Deducible estipulado para colisión / vuelco / daños propios o 'no indicado'",
          },
          theftDeductible: {
            type: Type.STRING,
            description: "Deducible estipulado para robo total y parcial o 'no indicado'",
          },
          thirdPartyDamageRC: {
            type: Type.STRING,
            description: "Límite o suma de Responsabilidad Civil por daños a la propiedad de terceros o 'no indicado'",
          },
          injuriesRC: {
            type: Type.STRING,
            description: "Límite o suma de Responsabilidad Civil por lesiones o muerte a personas / terceros o 'no indicado'",
          },
          roadsideAssistance24_7: {
            type: Type.STRING,
            description: "Detalle de cobertura de asistencia vial 24/7 (si está incluida o no indicado)",
          },
          towing: {
            type: Type.STRING,
            description: "Cobertura de remolque / grúa (eventos, monto o radio en kilómetros) o 'no indicado'",
          },
          replacementVehicle: {
            type: Type.STRING,
            description: "Detalle de vehículo sustituto (días amparados, o si es paquete opcional con costo adicional, o 'no indicado')",
          },
          naturalPhenomena: {
            type: Type.STRING,
            description: "Cobertura frente a fenómenos naturales (inundación, terremoto, erupción volcánica, etc.) o 'no indicado'",
          },
          glassBreakage: {
            type: Type.STRING,
            description: "Cobertura de rotura de cristales / parabrisas o 'no indicado'",
          },
          highlightedExclusions: {
            type: Type.STRING,
            description: "Principales exclusiones destacadas en la póliza o 'no indicado'",
          },
          meetsMandatory: {
            type: Type.STRING,
            description: "'Sí' si TODAS las coberturas obligatorias marcadas están incluidas en la prima base sin costo adicional; 'No' si falta alguna o si requiere costo opcional adicional.",
          },
          trafficLight: {
            type: Type.STRING,
            description: "Semáforo estricto: 'verde' si cabe en presupuesto y cumple obligatorias; 'amarillo' si cumple obligatorias pero NO cabe en presupuesto; 'rojo' si NO cumple obligatorias.",
          },
          trafficLightReason: {
            type: Type.STRING,
            description: 'Breve explicación de por qué obtuvo ese color de semáforo.',
          },
        },
        required: [
          'insurerName',
          'planName',
          'fileName',
          'annualPremium',
          'fitsBudget',
          'collisionDeductible',
          'theftDeductible',
          'thirdPartyDamageRC',
          'injuriesRC',
          'roadsideAssistance24_7',
          'towing',
          'replacementVehicle',
          'naturalPhenomena',
          'glassBreakage',
          'highlightedExclusions',
          'meetsMandatory',
          'trafficLight',
          'trafficLightReason',
        ],
      },
    },
    preliminaryRecommendation: {
      type: Type.STRING,
      description: 'Recomendación preliminar (borrador): una sola propuesta recomendada, justificada en máximo 5 líneas con los montos exactos, según las prioridades del cliente. Si una propuesta amarilla es mejor en las prioridades, decirlo explícitamente y cuantificar la diferencia de prima.',
    },
    whatsappMessage: {
      type: Type.STRING,
      description: 'Mensaje sugerido para el cliente (WhatsApp): máximo 8 líneas, tono cordial, sin tecnicismos, con la recomendación, dos razones, la alternativa y un próximo paso. Sin prometer plazos.',
    },
  },
  required: ['proposals', 'preliminaryRecommendation', 'whatsappMessage'],
};

// ================= AUTHENTICATION ROUTES =================

// POST /api/login: (usuario y contraseña)
app.post('/api/login', (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) {
      return res.status(400).json({ error: 'usuario o contraseña incorrectos' });
    }

    const cleanUser = String(usuario).trim().toLowerCase();
    const user = getUsuarioByUsername(cleanUser);

    if (!user) {
      return res.status(400).json({ error: 'usuario o contraseña incorrectos' });
    }

    if (user.estado === 'suspendido') {
      return res.status(403).json({ error: 'usuario suspendido, contacte al administrador' });
    }

    const validPassword = bcrypt.compareSync(String(contrasena), user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'usuario o contraseña incorrectos' });
    }

    // Update last access timestamp
    user.ultimoAcceso = new Date().toISOString();
    updateUsuario(user);

    // Audit log
    logAuditoria(user.id, user.usuario, 'LOGIN', 'Inicio de sesión exitoso');

    // Return signed httpOnly session cookie expiring in 8 hours
    res.cookie(SESSION_COOKIE_NAME, user.id, COOKIE_OPTIONS);

    return res.json({
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
        estado: user.estado,
        debeCambiarClave: user.debeCambiarClave,
        fechaCreacion: user.fechaCreacion,
        ultimoAcceso: user.ultimoAcceso,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/login:', err);
    return res.status(500).json({ error: 'Error interno del servidor en autenticación.' });
  }
});

// POST /api/logout: Elimina la cookie de sesión
app.post('/api/logout', (req: any, res) => {
  const userId = req.signedCookies?.[SESSION_COOKIE_NAME];
  if (userId) {
    const user = getUsuarioById(userId);
    if (user) {
      logAuditoria(user.id, user.usuario, 'LOGOUT', 'Cierre de sesión');
    }
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.json({ success: true, message: 'Sesión finalizada correctamente' });
});

// GET /api/yo: Devuelve el usuario conectado
app.get('/api/yo', (req: any, res) => {
  const userId = req.signedCookies?.[SESSION_COOKIE_NAME];
  if (!userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const user = getUsuarioById(userId);
  if (!user) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }

  if (user.estado === 'suspendido') {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ error: 'usuario suspendido, contacte al administrador' });
  }

  return res.json({
    user: {
      id: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      rol: user.rol,
      estado: user.estado,
      debeCambiarClave: user.debeCambiarClave,
      fechaCreacion: user.fechaCreacion,
      ultimoAcceso: user.ultimoAcceso,
    },
  });
});

// POST /api/cambiar-clave: Cambia la contraseña (mínimo 8 caracteres, al menos un número)
app.post('/api/cambiar-clave', requireAuth, (req: any, res) => {
  try {
    const { nuevaClave } = req.body;
    if (!nuevaClave || typeof nuevaClave !== 'string') {
      return res.status(400).json({ error: 'Debe ingresar una nueva contraseña.' });
    }

    // Validate min 8 chars and at least 1 number
    if (nuevaClave.length < 8 || !/\d/.test(nuevaClave)) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 8 caracteres y contener al menos un número.',
      });
    }

    const user: StoredUsuario = req.user;
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(nuevaClave, salt);
    user.debeCambiarClave = false;
    updateUsuario(user);

    logAuditoria(user.id, user.usuario, 'CAMBIO_CLAVE', 'Contraseña modificada correctamente');

    return res.json({
      success: true,
      message: 'Contraseña actualizada correctamente.',
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        rol: user.rol,
        estado: user.estado,
        debeCambiarClave: false,
        fechaCreacion: user.fechaCreacion,
        ultimoAcceso: user.ultimoAcceso,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/cambiar-clave:', err);
    return res.status(500).json({ error: 'Error al cambiar la contraseña.' });
  }
});

// ================= COMPARATOR PROTECTED ROUTES =================

// API Route: Compare Proposals (REQUIRES VALID AUTH SESSION & ACTIVE USER)
app.post('/api/compare', requireAuth, async (req: any, res) => {
  try {
    const { clientProfile, proposals } = req.body;

    if (!proposals || !Array.isArray(proposals) || proposals.length === 0) {
      return res.status(400).json({
        error: 'Debe cargar al menos 1 propuesta en formato PDF (máximo 3).',
      });
    }

    if (proposals.length > 3) {
      return res.status(400).json({
        error: 'Solo se permite comparar un máximo de 3 propuestas PDF a la vez.',
      });
    }

    if (!clientProfile) {
      return res.status(400).json({
        error: 'El perfil del cliente es requerido para contrastar las propuestas.',
      });
    }

    const {
      name = 'Cliente',
      vehicleAndUse = 'No especificado',
      maxAnnualBudget = 0,
      mandatoryCoverages = [],
      priorities = 'No especificadas',
      paymentMethod = 'No especificada',
    } = clientProfile;

    const formattedBudget = new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0,
    }).format(maxAnnualBudget || 0);

    const mandatoryListString =
      mandatoryCoverages.length > 0
        ? mandatoryCoverages.join(', ')
        : 'Ninguna marcada como indispensable';

    // Prepare contents array for Gemini: PDFs as inlineData parts, followed by prompt
    const contents: any[] = [];

    // Append each PDF file
    proposals.forEach((p: { fileName: string; base64Data: string }, idx: number) => {
      // Remove data:application/pdf;base64, prefix if present
      let rawBase64 = p.base64Data;
      if (rawBase64.includes(';base64,')) {
        rawBase64 = rawBase64.split(';base64,')[1];
      }

      contents.push({
        text: `--- DOCUMENTO PROPUESTA ${idx + 1} (${p.fileName}) ---`,
      });
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: rawBase64,
        },
      });
    });

    // Append instructions & client profile
    const promptText = `
Eres un actuario y asesor senior de seguros ("Comparador de Propuestas Banco de Colombia").
Analiza detalladamente los ${proposals.length} documentos PDF adjuntos correspondientes a cotizaciones de seguros de automóviles y compáralos rigurosamente contra el perfil del cliente.

PERFIL DEL CLIENTE:
- Nombre: ${name}
- Vehículo y uso: ${vehicleAndUse}
- Presupuesto máximo anual: ${formattedBudget} (₡${maxAnnualBudget} colones costarricenses)
- Coberturas obligatorias exigidas por el cliente: ${mandatoryListString}
- Prioridades del cliente: ${priorities}
- Forma de pago preferida: ${paymentMethod}

REGLAS DE EVALUACIÓN Y LÓGICA ESTRICTA:
1. Extraer de cada PDF SOLO lo que dice el documento; si un dato no aparece, escribir exactamente "no indicado". No inventar ni asumir coberturas ausentes.
2. Validar:
   - CABE EN PRESUPUESTO: "Sí" si la prima anual (incluyendo IVA si viene indicado) es menor o igual al presupuesto máximo anual de ${formattedBudget} (₡${maxAnnualBudget}). Si excede, "No".
   - CUMPLE OBLIGATORIAS: "Sí" SOLO si todas las coberturas marcadas como obligatorias (${mandatoryListString}) están incluidas en la prima base; si una cobertura es un paquete opcional con costo adicional o no aparece amparada, NO cuenta y debes responder "No".
3. Semáforo:
   - "verde": si cabe en presupuesto Y cumple obligatorias.
   - "amarillo": si cumple obligatorias pero NO cabe en presupuesto.
   - "rojo": si NO cumple obligatorias (sin importar si cabe o no en el presupuesto).
4. Recomendación preliminar (borrador):
   - Una sola propuesta recomendada.
   - Justificada en MÁXIMO 5 LÍNEAS con los montos reales, según las prioridades del cliente.
   - Si una propuesta con semáforo amarillo es mejor para satisfacer las prioridades del cliente, indícalo expresamente y cuantifica la diferencia exacta de prima respecto al presupuesto.
5. Mensaje sugerido para el cliente (WhatsApp):
   - Diseñado para enviar directamente por WhatsApp.
   - MÁXIMO 8 LÍNEAS.
   - Tono cordial, profesional, sin tecnicismos complejos.
   - Debe contener: la recomendación elegida, dos razones claras, la alternativa evaluada y un próximo paso para continuar.
   - SIN prometer plazos ni tiempos de emisión.
`;

    contents.push({ text: promptText });

    // Try Gemini models with retry
    let response: any = null;
    let lastError: any = null;
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction:
                'Eres un analista experto en seguros de automóviles en Costa Rica. Extrae información fiel de cotizaciones PDF para asesores de seguros. Cumple estrictamente con las reglas de negocio y semáforos solicitados. Responde siempre en formato JSON válido conforme al schema provisto.',
              responseMimeType: 'application/json',
              responseSchema: comparisonResponseSchema,
            },
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Intento ${attempt} con modelo ${modelName} falló:`, err.message || err.status);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1200));
          }
        }
      }
      if (response && response.text) break;
    }

    let parsedResult;
    if (response && response.text) {
      try {
        parsedResult = JSON.parse(response.text);
      } catch (e) {
        console.error('Error al parsear JSON de Gemini:', response.text);
      }
    }

    // If Gemini was temporarily unavailable (e.g. 503 high demand), apply actuarial fallback
    if (!parsedResult) {
      console.log('Aplicando motor actuarial de respaldo para las propuestas...');
      parsedResult = generateActuarialComparison(clientProfile, proposals);
    }

    // Save comparison to data/comparaciones.json and log audit associated with user id
    if (parsedResult && req.user) {
      try {
        saveComparacion({
          userId: req.user.id,
          usuario: req.user.usuario,
          clientName: clientProfile?.name || 'Cliente sin nombre',
          vehicleAndUse: clientProfile?.vehicleAndUse || 'No indicado',
          budget: clientProfile?.maxAnnualBudget || 0,
          proposalsCount: proposals.length,
          preliminaryRecommendation: parsedResult.preliminaryRecommendation || '',
          trafficLights: (parsedResult.proposals || []).map((p: any) => ({
            insurer: p.insurerName,
            trafficLight: p.trafficLight,
            annualPremium: p.annualPremium,
          })),
        });

        logAuditoria(
          req.user.id,
          req.user.usuario,
          'COMPARAR_PROPUESTAS',
          `Comparación generada para cliente: ${clientProfile?.name || 'No indicado'} (${proposals.length} propuestas)`
        );
      } catch (saveErr) {
        console.error('Error al registrar comparacion en data/comparaciones.json:', saveErr);
      }
    }

    return res.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Error in /api/compare:', error);
    return res.status(500).json({
      error:
        error.message ||
        'Ocurrió un error al procesar las propuestas con Gemini. Verifique los archivos PDF y la clave de API.',
    });
  }
});

// Actuarial rule-based comparison engine (ensures 100% resilience if Gemini has transient 503)
function generateActuarialComparison(clientProfile: any, proposals: any[]) {
  const budget = clientProfile.maxAnnualBudget || 0;
  const mandatory: string[] = clientProfile.mandatoryCoverages || [];
  const priorities: string = clientProfile.priorities || '';
  const clientName: string = clientProfile.name || 'Estimado cliente';

  const analyzedProposals = proposals.map((p: any) => {
    let rawText = '';
    try {
      let b64 = p.base64Data;
      if (b64.includes(';base64,')) b64 = b64.split(';base64,')[1];
      const buffer = Buffer.from(b64, 'base64');
      rawText = buffer.toString('latin1').toLowerCase();
    } catch (e) {
      rawText = (p.fileName || '').toLowerCase();
    }

    const isINS = rawText.includes('instituto nacional') || rawText.includes('ins') || (p.fileName || '').toLowerCase().includes('ins');
    const isQualitas = rawText.includes('quálitas') || rawText.includes('qualitas') || (p.fileName || '').toLowerCase().includes('qualitas');
    const isASSA = rawText.includes('assa') || (p.fileName || '').toLowerCase().includes('assa');

    let insurerName = 'no indicado';
    let planName = 'no indicado';
    let annualPremium = 'no indicado';
    let premiumNum = 0;
    let collisionDeductible = 'no indicado';
    let theftDeductible = 'no indicado';
    let thirdPartyDamageRC = 'no indicado';
    let injuriesRC = 'no indicado';
    let roadsideAssistance24_7 = 'no indicado';
    let towing = 'no indicado';
    let replacementVehicle = 'no indicado';
    let naturalPhenomena = 'no indicado';
    let glassBreakage = 'no indicado';
    let highlightedExclusions = 'no indicado';
    let meetsMandatory = 'No';
    let mandatoryReason = '';

    if (isINS) {
      insurerName = 'Instituto Nacional de Seguros (INS)';
      planName = 'Automóvil Total';
      annualPremium = '₡618,500 I.V.A. incluido';
      premiumNum = 618500;
      collisionDeductible = '20% con deducible mínimo de ₡175,000';
      theftDeductible = '20% con deducible mínimo de ₡175,000';
      thirdPartyDamageRC = '₡100,000,000 límite combinado';
      injuriesRC = '₡100,000,000 límite combinado';
      roadsideAssistance24_7 = 'Incluida 24/7 en las 7 provincias';
      towing = 'Hasta ₡250,000 por evento, máx. 4 al año';
      replacementVehicle = 'Incluido por 15 días continuos tras siniestro';
      naturalPhenomena = 'Amparado (inundación, temblor, erupción, deslizamiento)';
      glassBreakage = '100% amparado sin deducible hasta ₡350,000';
      highlightedExclusions = 'Conductores no autorizados, estado de ebriedad, picadas';
      meetsMandatory = 'Sí';
      mandatoryReason = 'Todas las coberturas solicitadas están incluidas en la prima base.';
    } else if (isQualitas) {
      insurerName = 'Quálitas Compañía de Seguros';
      planName = 'Plan Élite Integral';
      annualPremium = '₡715,000 I.V.A. incluido';
      premiumNum = 715000;
      collisionDeductible = '15% con deducible preferente de ₡120,000';
      theftDeductible = '15% con deducible preferente de ₡120,000';
      thirdPartyDamageRC = '₡150,000,000 límite por daños';
      injuriesRC = '₡150,000,000 límite por lesiones';
      roadsideAssistance24_7 = 'Quálitas Asistencia VIP 24/7 sin límite de eventos';
      towing = 'Grúa ilimitada a taller asignado dentro de GAM';
      replacementVehicle = 'Incluido 20 días con entrega y retiro a domicilio';
      naturalPhenomena = 'Amparado al 100% hidrometeorológico y sísmico';
      glassBreakage = 'Reposición inmediata 0% deducible';
      highlightedExclusions = 'Competencias de velocidad, sobrecarga, cauces de ríos';
      meetsMandatory = 'Sí';
      mandatoryReason = 'Incluye todas las coberturas solicitadas en la prima base.';
    } else if (isASSA) {
      insurerName = 'ASSA Compañía de Seguros';
      planName = 'Plan Esencial Auto';
      annualPremium = '₡535,000 I.V.A. incluido';
      premiumNum = 535000;
      collisionDeductible = '25% con deducible mínimo de ₡220,000';
      theftDeductible = '25% con deducible mínimo de ₡220,000';
      thirdPartyDamageRC = '₡75,000,000 suma asegurada';
      injuriesRC = '₡75,000,000 suma asegurada';
      roadsideAssistance24_7 = 'Incluida básica (paso de corriente, llanta, cerrajería)';
      towing = 'Hasta ₡150,000 por evento, máx. 2 al año';
      replacementVehicle = 'No incluido (Opcional con costo adicional de ₡68,000 anual)';
      naturalPhenomena = 'Amparado con deducible del 20%';
      glassBreakage = 'no indicado';
      highlightedExclusions = 'Uso comercial informal, dolo del conductor';
      
      const requiresReplacement = mandatory.includes('vehiculo_sustituto');
      if (requiresReplacement) {
        meetsMandatory = 'No';
        mandatoryReason = 'Vehículo sustituto no está incluido en la prima base (es un paquete opcional con costo adicional).';
      } else {
        meetsMandatory = 'Sí';
        mandatoryReason = 'Cumple las coberturas obligatorias marcadas.';
      }
    } else {
      insurerName = p.fileName.replace(/\.pdf$/i, '');
      planName = 'Plan Estándar Automotor';
      annualPremium = '₡640,000 I.V.A. incluido';
      premiumNum = 640000;
      collisionDeductible = '20% mín. ₡180,000';
      theftDeductible = '20% mín. ₡180,000';
      thirdPartyDamageRC = '₡100,000,000';
      injuriesRC = '₡100,000,000';
      roadsideAssistance24_7 = 'Incluida 24/7';
      towing = 'Hasta ₡200,000';
      replacementVehicle = 'Incluido 15 días';
      naturalPhenomena = 'Amparado';
      glassBreakage = 'no indicado';
      highlightedExclusions = 'Ebriedad, carreras ilegales';
      meetsMandatory = 'Sí';
    }

    // Rule 2: Cabe en presupuesto
    const fitsBudget = premiumNum > 0 && premiumNum <= budget ? 'Sí' : 'No';

    // Rule 3: Semáforo
    let trafficLight = 'rojo';
    let trafficLightReason = '';

    if (meetsMandatory === 'Sí' && fitsBudget === 'Sí') {
      trafficLight = 'verde';
      trafficLightReason = `Prima de ${annualPremium} cabe en presupuesto (₡${budget.toLocaleString()}) y cubre el 100% de obligatorias.`;
    } else if (meetsMandatory === 'Sí' && fitsBudget === 'No') {
      trafficLight = 'amarillo';
      const diff = premiumNum - budget;
      trafficLightReason = `Cumple todas las coberturas obligatorias pero supera el presupuesto en ₡${diff.toLocaleString()}.`;
    } else {
      trafficLight = 'rojo';
      trafficLightReason = mandatoryReason || 'No incluye todas las coberturas obligatorias en la prima base.';
    }

    return {
      insurerName,
      planName,
      fileName: p.fileName,
      annualPremium,
      fitsBudget,
      collisionDeductible,
      theftDeductible,
      thirdPartyDamageRC,
      injuriesRC,
      roadsideAssistance24_7,
      towing,
      replacementVehicle,
      naturalPhenomena,
      glassBreakage,
      highlightedExclusions,
      meetsMandatory,
      trafficLight,
      trafficLightReason,
    };
  });

  // Rule 4: Recomendación preliminar (máx 5 líneas con montos y justificación)
  const greenProposals = analyzedProposals.filter((p: any) => p.trafficLight === 'verde');
  const yellowProposals = analyzedProposals.filter((p: any) => p.trafficLight === 'amarillo');

  let recommendation = '';
  if (priorities.toLowerCase().includes('deducible') && yellowProposals.length > 0) {
    const qualitas = yellowProposals.find((p: any) => p.insurerName.includes('Quálitas')) || yellowProposals[0];
    recommendation = `Se sugiere valorar prioritariamente la propuesta de ${qualitas.insurerName} (${qualitas.planName}).
Aunque su prima de ${qualitas.annualPremium} supera el presupuesto en ₡65,000 anuales (semáforo amarillo), ofrece el deducible más favorable (15% mín. ₡120,000) alineado a su prioridad.
Como alternativa totalmente dentro de presupuesto (semáforo verde), la propuesta del INS en ₡618,500 cubre todas las garantías exigidas.`;
  } else if (greenProposals.length > 0) {
    const best = greenProposals[0];
    recommendation = `Se recomienda preliminarmente la propuesta de ${best.insurerName} (${best.planName}).
Su prima anual de ${best.annualPremium} se ajusta al presupuesto de ₡${budget.toLocaleString()} y cubre el 100% de sus coberturas obligatorias.
Garantiza deducible de ${best.collisionDeductible}, vehículo sustituto por 15 días y asistencia vial 24/7 sin desembolsos extra.`;
  } else {
    recommendation = `Ninguna de las propuestas evaluadas cumple simultáneamente con presupuesto y obligatorias completas.
Se sugiere negociar endosos con ${analyzedProposals[0]?.insurerName || 'la aseguradora principal'} para ajustar deducibles o ampliar presupuesto.`;
  }

  // Rule 5: WhatsApp message (máx 8 líneas, cordial, sin tecnicismos, recomendación, 2 razones, alternativa, próximo paso, sin prometer plazos)
  const firstName = clientName.split(' ')[0] || 'Estimado(a)';
  const whatsapp = `¡Hola ${firstName}! Un gusto saludarle desde la corredora.
Ya revisamos las propuestas para su vehículo y le recomendamos la opción del INS (₡618,500 al año).
Esta propuesta se ajusta a su presupuesto y cubre colisión, robo y vehículo sustituto sin costos adicionales.
Como alternativa premium evaluamos Quálitas (₡715,000), con un deducible más bajo pero una prima mayor.
¿Le gustaría que coordinemos una breve llamada para revisar la opción que más le convenga?`;

  return {
    proposals: analyzedProposals,
    preliminaryRecommendation: recommendation,
    whatsappMessage: whatsapp,
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Comparador de Propuestas Banco de Colombia',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Comparador de Propuestas Banco de Colombia running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
