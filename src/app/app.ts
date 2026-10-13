import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';

interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  solicitante: string;
  prioridad: string;
  estado: string;
  agente: string;
  fecha: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  seccionActual = 'dashboard';
  mostrarBandeja = true;
  mostrarFormulario = false;

  busqueda = '';
  filtroEstado = '';
  filtroPrioridad = '';
  filtroAgente = '';

  nuevoTicket = {
    titulo: '',
    descripcion: '',
    solicitante: '',
    prioridad: 'Media'
  };

  tickets: Ticket[] = [
    {
      id: 1001,
      titulo: 'No puedo iniciar sesión',
      descripcion: 'Error al entrar en la plataforma',
      solicitante: 'Juan Pérez',
      prioridad: 'Alta',
      estado: 'Abierto',
      agente: 'Agente 1',
      fecha: '13/10/2026'
    },
    {
      id: 1002,
      titulo: 'Problema con el correo',
      descripcion: 'No llegan los mensajes',
      solicitante: 'María Gómez',
      prioridad: 'Media',
      estado: 'En progreso',
      agente: 'Agente 2',
      fecha: '13/10/2026'
    },
    {
      id: 1003,
      titulo: 'Actualizar información',
      descripcion: 'Necesito actualizar mis datos',
      solicitante: 'Pedro Díaz',
      prioridad: 'Baja',
      estado: 'Resuelto',
      agente: 'Agente 1',
      fecha: '12/10/2026'
    },
    {
      id: 1004,
      titulo: 'Sistema lento',
      descripcion: 'La página tarda en cargar',
      solicitante: 'Ana Rodríguez',
      prioridad: 'Alta',
      estado: 'Abierto',
      agente: 'Agente 2',
      fecha: '12/10/2026'
    }
  ];

  constructor(private router: Router) {}

  // ABRIR BANDEJA DE TICKETS
  irABandeja(): void {
    this.seccionActual = 'dashboard';
    this.mostrarBandeja = true;
    this.mostrarFormulario = false;

    this.router.navigateByUrl('/');
  }

  // ABRIR LA SECCIÓN TICKETS
  irATickets(): void {
    this.seccionActual = 'tickets';
    this.mostrarBandeja = true;
    this.mostrarFormulario = false;

    this.router.navigateByUrl('/');
  }

  // ABRIR DETALLES DE LLAMADAS
  irADetallesLlamadas(): void {
    this.seccionActual = 'llamadas';
    this.mostrarBandeja = false;
    this.mostrarFormulario = false;

    this.router.navigateByUrl('/llamadas/detalle');
  }

  // FILTRAR TICKETS
  get ticketsFiltrados(): Ticket[] {
    const texto = this.busqueda.toLowerCase().trim();

    return this.tickets.filter(ticket => {
      const coincideBusqueda =
        ticket.titulo.toLowerCase().includes(texto) ||
        ticket.descripcion.toLowerCase().includes(texto) ||
        ticket.solicitante.toLowerCase().includes(texto) ||
        ticket.id.toString().includes(texto);

      const coincideEstado =
        !this.filtroEstado ||
        ticket.estado === this.filtroEstado;

      const coincidePrioridad =
        !this.filtroPrioridad ||
        ticket.prioridad === this.filtroPrioridad;

      const coincideAgente =
        !this.filtroAgente ||
        ticket.agente === this.filtroAgente;

      return coincideBusqueda &&
        coincideEstado &&
        coincidePrioridad &&
        coincideAgente;
    });
  }

  // CONTAR POR ESTADO
  contarEstado(estado: string): number {
    return this.tickets.filter(
      ticket => ticket.estado === estado
    ).length;
  }

  // ABRIR FORMULARIO
  abrirFormulario(): void {
    this.mostrarFormulario = true;
  }

  // CERRAR FORMULARIO
  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  // CREAR TICKET
  crearTicket(): void {
    if (
      !this.nuevoTicket.titulo.trim() ||
      !this.nuevoTicket.descripcion.trim() ||
      !this.nuevoTicket.solicitante.trim()
    ) {
      alert('Completa todos los campos del formulario.');
      return;
    }

    const nuevo: Ticket = {
      id: this.tickets.length > 0
        ? Math.max(...this.tickets.map(t => t.id)) + 1
        : 1001,

      titulo: this.nuevoTicket.titulo.trim(),
      descripcion: this.nuevoTicket.descripcion.trim(),
      solicitante: this.nuevoTicket.solicitante.trim(),
      prioridad: this.nuevoTicket.prioridad,
      estado: 'Abierto',
      agente: 'Agente 1',
      fecha: new Date().toLocaleDateString('es-DO')
    };

    this.tickets = [nuevo, ...this.tickets];

    this.nuevoTicket = {
      titulo: '',
      descripcion: '',
      solicitante: '',
      prioridad: 'Media'
    };

    this.mostrarFormulario = false;

    alert('¡Ticket creado correctamente!');
  }
}