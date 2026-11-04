export interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  rol: 'administrador' | 'asesor';
  estado: 'activo' | 'suspendido';
  debeCambiarClave: boolean;
  fechaCreacion?: string;
  ultimoAcceso?: string | null;
}

export interface ClientProfile {
  name: string;
  vehicleAndUse: string;
  maxAnnualBudget: number;
  mandatoryCoverages: string[];
  priorities: string;
  paymentMethod: string;
}

export interface ProposalFile {
  id: string;
  file?: File;
  fileName: string;
  fileSize?: string;
  base64Data: string;
  previewUrl?: string;
  insurerHint?: string;
}

export interface AnalyzedProposal {
  insurerName: string;
  planName: string;
  fileName: string;
  annualPremium: string;
  fitsBudget: string;
  collisionDeductible: string;
  theftDeductible: string;
  thirdPartyDamageRC: string;
  injuriesRC: string;
  roadsideAssistance24_7: string;
  towing: string;
  replacementVehicle: string;
  naturalPhenomena: string;
  glassBreakage: string;
  highlightedExclusions: string;
  meetsMandatory: string;
  trafficLight: 'verde' | 'amarillo' | 'rojo' | string;
  trafficLightReason: string;
}

export interface ComparisonResult {
  proposals: AnalyzedProposal[];
  preliminaryRecommendation: string;
  whatsappMessage: string;
}

export const MANDATORY_COVERAGE_OPTIONS = [
  { id: 'colision', label: 'Colisión' },
  { id: 'robo', label: 'Robo' },
  { id: 'asistencia_vial', label: 'Asistencia vial 24/7' },
  { id: 'fenomenos_naturales', label: 'Fenómenos naturales' },
  { id: 'vehiculo_sustituto', label: 'Vehículo sustituto' },
];

export const PAYMENT_METHOD_OPTIONS = [
  'Mensual sin intereses (12 cuotas)',
  'Trimestral',
  'Semestral',
  'Anual de contado (con descuento)',
  'Cargo automático en tarjeta (Banco de Colombia / BAC / BCR)',
];
