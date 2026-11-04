import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleProposal {
  fileName: string;
  insurerName: string;
  planName: string;
  base64: string;
}

function sanitizePdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/₡/g, 'CRC ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, (match) => {
      // allow standard accented vowels in WinAnsi: á, é, í, ó, ú, ñ
      return match;
    })
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

export async function generateSamplePdf(
  insurerName: string,
  planName: string,
  quoteNumber: string,
  annualPremium: string,
  details: {
    deductibleCollision: string;
    deductibleTheft: string;
    rcDamage: string;
    rcInjuries: string;
    roadsideAssistance: string;
    towing: string;
    replacementVehicle: string;
    naturalPhenomena: string;
    glassBreakage: string;
    exclusions: string;
    paymentOptions: string;
  }
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();

  // Header background bar (Marine Blue)
  page.drawRectangle({
    x: 0,
    y: height - 90,
    width: width,
    height: 90,
    color: rgb(0.04, 0.15, 0.28), // Marine blue #0A2647
  });

  // Header Title
  page.drawText(insurerName.toUpperCase(), {
    x: 40,
    y: height - 42,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`PROPUESTA DE SEGURO AUTOMOTOR - ${planName.toUpperCase()}`, {
    x: 40,
    y: height - 65,
    size: 11,
    font: fontRegular,
    color: rgb(0.85, 0.9, 0.98),
  });

  page.drawText(`Cotización N°: ${quoteNumber}`, {
    x: width - 180,
    y: height - 42,
    size: 10,
    font: fontBold,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText(`Fecha: 03/11/2026`, {
    x: width - 180,
    y: height - 60,
    size: 9,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.95),
  });

  // Body content
  let currentY = height - 120;

  // Insured info box
  page.drawRectangle({
    x: 40,
    y: currentY - 55,
    width: width - 80,
    height: 55,
    color: rgb(0.95, 0.96, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page.drawText('DATOS GENERALES DE LA COTIZACIÓN', {
    x: 52,
    y: currentY - 18,
    size: 10,
    font: fontBold,
    color: rgb(0.05, 0.18, 0.35),
  });

  page.drawText(`Asegurado estimado: Cliente Referido Banco de Colombia`, {
    x: 52,
    y: currentY - 33,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(`Vehículo tasado: Automóvil Particular / Laboral`, {
    x: 52,
    y: currentY - 47,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(`Prima Anual Total (IVA Incluido):`, {
    x: width - 260,
    y: currentY - 26,
    size: 9,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(annualPremium.replace(/₡/g, 'CRC '), {
    x: width - 260,
    y: currentY - 45,
    size: 14,
    font: fontBold,
    color: rgb(0.05, 0.45, 0.2), // Greenish highlight
  });

  currentY -= 75;

  // Table header
  page.drawRectangle({
    x: 40,
    y: currentY - 22,
    width: width - 80,
    height: 22,
    color: rgb(0.08, 0.22, 0.38),
  });

  page.drawText('DESGLOSE DE COBERTURAS Y CONDICIONES', {
    x: 50,
    y: currentY - 16,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 22;

  const rows = [
    { label: 'Prima anual estipulada', value: annualPremium },
    { label: 'Deducible Colision / Dano', value: details.deductibleCollision },
    { label: 'Deducible Robo Total / Parcial', value: details.deductibleTheft },
    { label: 'Responsabilidad Civil (Danos a Terceros)', value: details.rcDamage },
    { label: 'Responsabilidad Civil (Lesiones / Personas)', value: details.rcInjuries },
    { label: 'Asistencia Vial 24/7', value: details.roadsideAssistance },
    { label: 'Servicio de Grua', value: details.towing },
    { label: 'Vehiculo Sustituto', value: details.replacementVehicle },
    { label: 'Fenomenos Naturales', value: details.naturalPhenomena },
    { label: 'Rotura de Cristales / Parabrisas', value: details.glassBreakage },
    { label: 'Exclusiones destacadas', value: details.exclusions },
    { label: 'Modalidad y forma de pago', value: details.paymentOptions },
  ];

  rows.forEach((row, index) => {
    const isEven = index % 2 === 0;
    const rowHeight = 32;

    page.drawRectangle({
      x: 40,
      y: currentY - rowHeight,
      width: width - 80,
      height: rowHeight,
      color: isEven ? rgb(0.98, 0.99, 1.0) : rgb(0.93, 0.95, 0.97),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 0.5,
    });

    const cleanLabel = sanitizePdfText(row.label);
    const cleanVal = sanitizePdfText(row.value);

    page.drawText(cleanLabel, {
      x: 50,
      y: currentY - 18,
      size: 8.5,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });

    // Handle multiline text if long
    if (cleanVal.length > 55) {
      page.drawText(cleanVal.substring(0, 52) + '...', {
        x: 215,
        y: currentY - 18,
        size: 8,
        font: fontRegular,
        color: rgb(0.15, 0.15, 0.15),
      });
    } else {
      page.drawText(cleanVal, {
        x: 215,
        y: currentY - 18,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.15, 0.15, 0.15),
      });
    }

    currentY -= rowHeight;
  });

  // Footer note
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: 45,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  });

  page.drawText('Documento emitido para fines comparativos de corretaje de seguros en la República de Costa Rica.', {
    x: 48,
    y: 68,
    size: 7.5,
    font: fontBold,
    color: rgb(0.3, 0.35, 0.4),
  });

  page.drawText('Sujeto a inspección vehicular previa y aprobación de suscripción según condiciones generales registradas ante la SUGESE.', {
    x: 48,
    y: 52,
    size: 7,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  // Return base64 string
  let binary = '';
  const len = pdfBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(pdfBytes[i]);
  }
  return btoa(binary);
}

export async function createPredefinedProposals(): Promise<SampleProposal[]> {
  const insBase64 = await generateSamplePdf(
    'Instituto Nacional de Seguros (INS)',
    'Póliza Automóvil Total',
    'INS-CR-2026-9481',
    '₡618,500 I.V.A. incluido',
    {
      deductibleCollision: '20% con deducible mínimo de ₡175,000 colones',
      deductibleTheft: '20% con deducible mínimo de ₡175,000 colones',
      rcDamage: '₡100,000,000 límite único combinado por evento',
      rcInjuries: '₡100,000,000 límite combinado por personas',
      roadsideAssistance: 'Incluida 24/7 en las 7 provincias de Costa Rica',
      towing: 'Cobertura hasta ₡250,000 por evento, máx. 4 traslados al año',
      replacementVehicle: 'Incluido por 15 días continuos tras siniestro',
      naturalPhenomena: 'Amparado (inundación, terremoto, erupción volcánica, deslizamiento)',
      glassBreakage: '100% amparado sin deducible hasta ₡350,000 anual',
      exclusions: 'Conductores no autorizados, estado de ebriedad, picadas de velocidad',
      paymentOptions: '12 cuotas mensuales sin intereses de ₡51,542 o pago anual con 5% de descuento',
    }
  );

  const qualitasBase64 = await generateSamplePdf(
    'Quálitas Compañía de Seguros Costa Rica',
    'Plan Élite Integral',
    'QLT-SJO-2026-4412',
    '₡715,000 I.V.A. incluido',
    {
      deductibleCollision: '15% con deducible mínimo preferente de ₡120,000 colones',
      deductibleTheft: '15% con deducible mínimo preferente de ₡120,000 colones',
      rcDamage: '₡150,000,000 límite amplio por daños materiales',
      rcInjuries: '₡150,000,000 límite amplio por lesiones a terceros',
      roadsideAssistance: 'Quálitas Asistencia VIP 24/7 sin límite de eventos viales',
      towing: 'Grúa ilimitada a taller asignado dentro del Gran Área Metropolitana',
      replacementVehicle: 'Incluido 20 días con entrega y retiro a domicilio',
      naturalPhenomena: 'Amparado al 100% ante eventos hidrometeorológicos y sísmicos',
      glassBreakage: 'Reposición inmediata en red autorizada con 0% deducible',
      exclusions: 'Uso en competencias deportivas, sobrecarga, cruce de ríos o cauces',
      paymentOptions: 'Pago semestral de ₡357,500 o cargo automático en tarjeta mensual',
    }
  );

  const assaBase64 = await generateSamplePdf(
    'ASSA Compañía de Seguros',
    'Plan Esencial Auto',
    'ASSA-CR-88231',
    '₡535,000 I.V.A. incluido',
    {
      deductibleCollision: '25% con deducible mínimo de ₡220,000 colones',
      deductibleTheft: '25% con deducible mínimo de ₡220,000 colones',
      rcDamage: '₡75,000,000 suma asegurada',
      rcInjuries: '₡75,000,000 suma asegurada',
      roadsideAssistance: 'Incluida básica (paso de corriente, cambio de llanta, cerrajería)',
      towing: 'Hasta ₡150,000 por evento, máx. 2 eventos al año',
      replacementVehicle: 'No incluido en la prima base (Paquete Opcional Auto Temporal disponible por costo adicional de ₡68,000 anual)',
      naturalPhenomena: 'Amparado con deducible del 20%',
      glassBreakage: 'no indicado',
      exclusions: 'Uso comercial o plataforma informal no declarada, dolo del conductor',
      paymentOptions: 'Pago de contado o financiamiento con banco aliado',
    }
  );

  return [
    {
      fileName: 'Propuesta_INS_Automovil_Total.pdf',
      insurerName: 'INS Seguros',
      planName: 'Automóvil Total',
      base64: insBase64,
    },
    {
      fileName: 'Propuesta_Qualitas_Elite_Integral.pdf',
      insurerName: 'Quálitas Seguros',
      planName: 'Élite Integral',
      base64: qualitasBase64,
    },
    {
      fileName: 'Propuesta_ASSA_Esencial_Auto.pdf',
      insurerName: 'ASSA Seguros',
      planName: 'Esencial Auto',
      base64: assaBase64,
    },
  ];
}
