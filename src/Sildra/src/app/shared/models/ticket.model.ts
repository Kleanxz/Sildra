export type Prioridad = 'P1' | 'P2' | 'P3';
export type Estado = 'Abierto' | 'En progreso' | 'Pendiente' | 'Resuelto';

export interface Ticket {
  dbId: string;
  id: string;
  titulo: string;
  descripcion: string;
  solicitante: string;
  email: string;
  telefono: string;
  organizacion: string;
  organizacionId: string;
  sucursal: string;
  categoria: string;
  prioridad: Prioridad;
  estado: Estado;
  agente: string;
  agenteId: string | null;
  cola: string;
  canal: string;
  creado: string;
  slaHoras: number;
  slaRestante: number;
  slaDeadline: string | null;
  resolutionNotes: string;
}

export interface ApiTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  organization: string;
  branch: string;
  category: string;
  priority: Prioridad;
  status: Estado;
  agent: string;
  assigneeId: string | null;
  queue: string;
  channel: string;
  createdAt: string;
  slaDeadline: string;
  resolutionNotes: string;
}

export interface TicketChatMessage {
  id: string;
  ticketId: string;
  authorId: string | null;
  authorName: string;
  authorRole: 'Admin' | 'Agent' | 'User' | string;
  message: string;
  createdAt: string;
}
