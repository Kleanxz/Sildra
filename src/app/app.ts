
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Ticket {
  id: string;
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
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  mostrarFormulario = false;

  busqueda = '';
  filtroEstado = '';
  filtroPrioridad = '';
  filtroAgente = '';

  paginaActual = 1;
  ticketsPorPagina = 5;

  nuevoTicket = {
    titulo: '',
    descripcion: '',
    solicitante: '',
    prioridad: 'Media'
  };

  tickets: Ticket[] = [

    {
      id: '#TK-001',
      titulo: 'No puedo acceder al sistema',
      descripcion: 'Problema con las credenciales de acceso',
      solicitante: 'Juan Pérez',
      prioridad: 'Alta',
      estado: 'Abierto',
      agente: 'María',
      fecha: '06/10/2026'
    },

    {
      id: '#TK-002',
      titulo: 'Error al generar reporte',
      descripcion: 'El reporte muestra información incorrecta',
      solicitante: 'Ana Rodríguez',
      prioridad: 'Media',
      estado: 'En progreso',
      agente: 'Carlos',
      fecha: '05/10/2026'
    },

    {
      id: '#TK-003',
      titulo: 'Solicitud de acceso',
      descripcion: 'Necesito acceso al módulo de ventas',
      solicitante: 'Pedro Gómez',
      prioridad: 'Baja',
      estado: 'Resuelto',
      agente: 'María',
      fecha: '04/10/2026'
    },

    {
      id: '#TK-004',
      titulo: 'Sistema lento',
      descripcion: 'La aplicación tarda mucho en cargar',
      solicitante: 'Laura Martínez',
      prioridad: 'Alta',
      estado: 'Abierto',
      agente: 'Carlos',
      fecha: '03/10/2026'
    },

    {
      id: '#TK-005',
      titulo: 'Problema con impresora',
      descripcion: 'La impresora no responde al enviar documentos',
      solicitante: 'Luis Sánchez',
      prioridad: 'Media',
      estado: 'En progreso',
      agente: 'María',
      fecha: '02/10/2026'
    },

    {
      id: '#TK-006',
      titulo: 'Actualizar contraseña',
      descripcion: 'El usuario necesita cambiar su contraseña',
      solicitante: 'Sofía Ramírez',
      prioridad: 'Baja',
      estado: 'Resuelto',
      agente: 'Carlos',
      fecha: '01/10/2026'
    },

    {
      id: '#TK-007',
      titulo: 'Error en módulo de ventas',
      descripcion: 'No permite registrar una nueva venta',
      solicitante: 'Miguel Torres',
      prioridad: 'Alta',
      estado: 'Abierto',
      agente: 'María',
      fecha: '30/09/2026'
    },

    {
      id: '#TK-008',
      titulo: 'No funciona el correo',
      descripcion: 'El usuario no puede enviar correos electrónicos',
      solicitante: 'Daniel Castillo',
      prioridad: 'Media',
      estado: 'En progreso',
      agente: 'Carlos',
      fecha: '29/09/2026'
    },

    {
      id: '#TK-009',
      titulo: 'Solicitud de nuevo usuario',
      descripcion: 'Se necesita crear una cuenta para un empleado',
      solicitante: 'Carla Gómez',
      prioridad: 'Baja',
      estado: 'Resuelto',
      agente: 'María',
      fecha: '28/09/2026'
    },

    {
      id: '#TK-010',
      titulo: 'Error de conexión',
      descripcion: 'El sistema pierde conexión con el servidor',
      solicitante: 'José Díaz',
      prioridad: 'Alta',
      estado: 'Abierto',
      agente: 'Carlos',
      fecha: '27/09/2026'
    },

    {
      id: '#TK-011',
      titulo: 'Pantalla en blanco',
      descripcion: 'La pantalla principal no muestra información',
      solicitante: 'Gabriela Núñez',
      prioridad: 'Media',
      estado: 'En progreso',
      agente: 'María',
      fecha: '26/09/2026'
    },

    {
      id: '#TK-012',
      titulo: 'Consulta sobre permisos',
      descripcion: 'El usuario necesita permisos adicionales',
      solicitante: 'Andrés López',
      prioridad: 'Baja',
      estado: 'Resuelto',
      agente: 'Carlos',
      fecha: '25/09/2026'
    }

  ];

  abrirFormulario() {
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
  }

  contarEstado(estado: string) {
    return this.tickets.filter(
      ticket => ticket.estado === estado
    ).length;
  }

  ticketsFiltrados() {

    const texto = this.busqueda.toLowerCase().trim();

    return this.tickets.filter(ticket => {

      const coincideBusqueda =
        !texto ||
        ticket.id.toLowerCase().includes(texto) ||
        ticket.titulo.toLowerCase().includes(texto) ||
        ticket.descripcion.toLowerCase().includes(texto) ||
        ticket.solicitante.toLowerCase().includes(texto);

      const coincideEstado =
        !this.filtroEstado ||
        ticket.estado === this.filtroEstado;

      const coincidePrioridad =
        !this.filtroPrioridad ||
        ticket.prioridad === this.filtroPrioridad;

      const coincideAgente =
        !this.filtroAgente ||
        ticket.agente === this.filtroAgente;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincidePrioridad &&
        coincideAgente
      );
    });
  }

  ticketsPaginados() {

    const inicio =
      (this.paginaActual - 1) * this.ticketsPorPagina;

    const fin =
      inicio + this.ticketsPorPagina;

    return this.ticketsFiltrados().slice(inicio, fin);
  }

  totalPaginas() {

    return Math.ceil(
      this.ticketsFiltrados().length /
      this.ticketsPorPagina
    );
  }

  cambiarPagina(pagina: number) {

    if (
      pagina >= 1 &&
      pagina <= this.totalPaginas()
    ) {
      this.paginaActual = pagina;
    }
  }

  crearTicket() {

    if (
      !this.nuevoTicket.titulo.trim() ||
      !this.nuevoTicket.descripcion.trim() ||
      !this.nuevoTicket.solicitante.trim()
    ) {
      alert('Completa todos los campos');
      return;
    }

    const nuevo: Ticket = {

      id:
        '#TK-' +
        String(this.tickets.length + 1).padStart(3, '0'),

      titulo:
        this.nuevoTicket.titulo,

      descripcion:
        this.nuevoTicket.descripcion,

      solicitante:
        this.nuevoTicket.solicitante,

      prioridad:
        this.nuevoTicket.prioridad,

      estado: 'Abierto',

      agente: 'Sin asignar',

      fecha:
        new Date().toLocaleDateString('es-DO')
    };

    this.tickets.unshift(nuevo);

    this.nuevoTicket = {
      titulo: '',
      descripcion: '',
      solicitante: '',
      prioridad: 'Media'
    };

    this.paginaActual = 1;

    this.mostrarFormulario = false;
  }
}
