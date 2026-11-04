import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'usuarios.json');
const COMPARISONS_FILE = path.join(DATA_DIR, 'comparaciones.json');
const AUDIT_FILE = path.join(DATA_DIR, 'auditoria.json');

export interface StoredUsuario {
  id: string;
  usuario: string; // short name, no spaces, lowercase
  nombre: string;
  rol: 'administrador' | 'asesor';
  estado: 'activo' | 'suspendido';
  debeCambiarClave: boolean;
  fechaCreacion: string;
  ultimoAcceso: string | null;
  passwordHash: string;
}

export interface StoredComparacion {
  id: string;
  userId: string;
  usuario: string;
  fecha: string;
  clientName: string;
  vehicleAndUse: string;
  budget: number;
  proposalsCount: number;
  preliminaryRecommendation: string;
  trafficLights: Array<{ insurer: string; trafficLight: string; annualPremium: string }>;
}

export interface StoredAuditoria {
  id: string;
  userId: string;
  usuario: string;
  accion: string;
  detalle: string;
  fecha: string;
}

// Ensure data folder and initial files exist
export function initDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Initial users file
  if (!fs.existsSync(USERS_FILE)) {
    const salt = bcrypt.genSaltSync(10);
    const initialHash = bcrypt.hashSync('Fundepos2026*', salt);

    const initialAdmin: StoredUsuario = {
      id: 'usr-admin-initial',
      usuario: 'admin',
      nombre: 'Administrador',
      rol: 'administrador',
      estado: 'activo',
      debeCambiarClave: true,
      fechaCreacion: new Date().toISOString(),
      ultimoAcceso: null,
      passwordHash: initialHash,
    };

    fs.writeFileSync(USERS_FILE, JSON.stringify([initialAdmin], null, 2), 'utf-8');
    console.log('[AuthStore] data/usuarios.json creado con administrador inicial (admin).');
  }

  // 2. Initial comparaciones file
  if (!fs.existsSync(COMPARISONS_FILE)) {
    fs.writeFileSync(COMPARISONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  // 3. Initial auditoria file
  if (!fs.existsSync(AUDIT_FILE)) {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllUsuarios(): StoredUsuario[] {
  try {
    if (!fs.existsSync(USERS_FILE)) initDataStore();
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[AuthStore] Error leyendo usuarios.json:', err);
    return [];
  }
}

export function getUsuarioByUsername(usuario: string): StoredUsuario | undefined {
  const users = getAllUsuarios();
  const clean = usuario.trim().toLowerCase();
  return users.find((u) => u.usuario.toLowerCase() === clean);
}

export function getUsuarioById(id: string): StoredUsuario | undefined {
  const users = getAllUsuarios();
  return users.find((u) => u.id === id);
}

export function updateUsuario(updated: StoredUsuario): boolean {
  try {
    const users = getAllUsuarios();
    const idx = users.findIndex((u) => u.id === updated.id);
    if (idx === -1) return false;
    users[idx] = updated;
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[AuthStore] Error guardando usuario:', err);
    return false;
  }
}

export function saveComparacion(record: Omit<StoredComparacion, 'id' | 'fecha'>): StoredComparacion {
  try {
    if (!fs.existsSync(COMPARISONS_FILE)) initDataStore();
    const existing = JSON.parse(fs.readFileSync(COMPARISONS_FILE, 'utf-8')) as StoredComparacion[];
    const newRecord: StoredComparacion = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fecha: new Date().toISOString(),
      ...record,
    };
    existing.unshift(newRecord);
    fs.writeFileSync(COMPARISONS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    return newRecord;
  } catch (err) {
    console.error('[AuthStore] Error guardando comparacion:', err);
    throw err;
  }
}

export function logAuditoria(userId: string, usuario: string, accion: string, detalle: string) {
  try {
    if (!fs.existsSync(AUDIT_FILE)) initDataStore();
    const existing = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8')) as StoredAuditoria[];
    const newAudit: StoredAuditoria = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      usuario,
      accion,
      detalle,
      fecha: new Date().toISOString(),
    };
    existing.unshift(newAudit);
    // Keep last 1000 records to prevent unbounded growth
    if (existing.length > 1000) existing.length = 1000;
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AuthStore] Error guardando auditoria:', err);
  }
}
