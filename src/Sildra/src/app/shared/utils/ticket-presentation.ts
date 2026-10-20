import { Ticket } from '../models';

export function porcentajeSla(ticket: Ticket): number {
  if (ticket.slaHoras <= 0) return 0;
  return Math.max(0, Math.min(100, (ticket.slaRestante / ticket.slaHoras) * 100));
}

export function claseSla(ticket: Ticket): string {
  if (ticket.slaRestante <= 0) return 'sla-danger';
  if (ticket.slaRestante <= 2) return 'sla-warning';
  return 'sla-good';
}

export function textoSla(ticket: Ticket): string {
  const minutes =
    ticket.slaRestante <= 0
      ? Math.floor(Math.abs(ticket.slaRestante) * 60)
      : Math.ceil(ticket.slaRestante * 60);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const time =
    hours > 0
      ? `${hours} h${remainder > 0 ? ` ${remainder} min` : ''}`
      : `${Math.max(0, remainder)} min`;

  return ticket.slaRestante <= 0 ? `Vencido hace ${time}` : `${time} restantes`;
}

export function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha));
}
