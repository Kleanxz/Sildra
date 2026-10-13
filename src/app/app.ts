
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
  mostrarDetalle = false;
  mostrarAsignacion = false;
  activeTab = 'Mis tickets';

  ticketSeleccionado: Ticket | null = null;
  agenteSeleccionado = '';

  busqueda = '';
  filtroEstado = '';
  filtroPrioridad = '';
  filtroAgente = '';

  paginaActual = 1;
  ticketsPorPagina = 6;

  agentes = ['María', 'Carlos', 'Luis', 'Sin asignar'];

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

  abrirDetalle(ticket: Ticket) {
    this.ticketSeleccionado = ticket;
    this.mostrarDetalle = true;
  }

  cerrarDetalle() {
    this.mostrarDetalle = false;
    this.ticketSeleccionado = null;
  }

  abrirAsignacion(ticket: Ticket) {
    this.ticketSeleccionado = ticket;
    this.agenteSeleccionado =
      ticket.agente === 'Sin asignar' ? '' : ticket.agente;
    this.mostrarAsignacion = true;
  }

  cerrarAsignacion() {
    this.mostrarAsignacion = false;
    this.ticketSeleccionado = null;
    this.agenteSeleccionado = '';
  }

  asignarAgente() {
    if (!this.ticketSeleccionado || !this.agenteSeleccionado) {
      alert('Selecciona un agente');
      return;
    }

    this.ticketSeleccionado.agente = this.agenteSeleccionado;
    this.cerrarAsignacion();
  }

  asignarDesdeDetalle() {
    const ticket = this.ticketSeleccionado;

    if (!ticket) return;

    this.mostrarDetalle = false;
    this.abrirAsignacion(ticket);
  }

  abrirFormulario() {
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
  }

  cambiarPestana(pestana: string) {
    this.activeTab = pestana;
    this.paginaActual = 1;
  }

  contarEstado(estado: string) {
    return this.tickets.filter(
      ticket => ticket.estado === estado
    ).length;
  }

  contarSinAsignar() {
    return this.tickets.filter(
      ticket => ticket.agente === 'Sin asignar'
    ).length;
  }

  contarRiesgoSLA() {
    return this.tickets.filter(
      ticket =>
        ticket.prioridad === 'Alta' &&
        ticket.estado !== 'Resuelto'
    ).length;
  }

  contarVencidos() {
    return this.tickets.filter(
      ticket =>
        ticket.prioridad === 'Alta' &&
        ticket.estado === 'Abierto'
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
        ticket.solicitante.toLowerCase().includes(texto) ||
        ticket.agente.toLowerCase().includes(texto);

      const coincideEstado =
        !this.filtroEstado ||
        (this.filtroEstado === 'Activos' &&
          ticket.estado !== 'Resuelto') ||
        ticket.estado === this.filtroEstado;

      const coincidePrioridad =
        !this.filtroPrioridad ||
        ticket.prioridad === this.filtroPrioridad;

      const coincideAgente =
        !this.filtroAgente ||
        ticket.agente === this.filtroAgente;

      const coincidePestana =
        this.activeTab === 'Mis tickets' ||
        this.activeTab === 'Mis colas' ||
        (this.activeTab === 'Sin asignar' &&
          ticket.agente === 'Sin asignar') ||
        (this.activeTab === 'Riesgo de SLA' &&
          ticket.prioridad === 'Alta' &&
          ticket.estado !== 'Resuelto') ||
        (this.activeTab === 'Vencidos' &&
          ticket.prioridad === 'Alta' &&
          ticket.estado === 'Abierto');

      return coincideBusqueda &&
        coincideEstado &&
        coincidePrioridad &&
        coincideAgente &&
        coincidePestana;
    });
  }

  ticketsPaginados() {
    const inicio =
      (this.paginaActual - 1) * this.ticketsPorPagina;

    return this.ticketsFiltrados().slice(
      inicio,
      inicio + this.ticketsPorPagina
    );
  }

  totalPaginas() {
    return Math.ceil(
      this.ticketsFiltrados().length /
      this.ticketsPorPagina
    );
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual = pagina;
    }
  }

  categoriaTicket(ticket: Ticket): string {
    const titulo = ticket.titulo.toLowerCase();

    if (titulo.includes('impresora')) return 'hardware';

    if (titulo.includes('reporte') || titulo.includes('venta')) {
      return 'ventas';
    }

    if (titulo.includes('contraseña') || titulo.includes('acceder')) {
      return 'software';
    }

    if (titulo.includes('correo')) return 'comunicaciones';

    if (titulo.includes('conexión') || titulo.includes('lento')) {
      return 'software';
    }

    return 'soporte general';
  }

  organizacionTicket(ticket: Ticket): string {
    const organizaciones = [
      'Distribuidora Cibao Norte',
      'Farmacia Nueva Vida',
      'Ferretería Ozama',
      'Supermercado La Económica',
      'Cooperativa San José',
      'Colmado Hermanos Peña'
    ];

    const numero = parseInt(ticket.id.slice(-3), 10) || 1;

    return organizaciones[(numero - 1) % organizaciones.length];
  }

  sucursalTicket(ticket: Ticket): string {
    const sucursales = [
      'Santiago',
      'Churchill',
      'Principal',
      'Villa Mella',
      'Oficina central',
      'Santo Domingo'
    ];

    const numero = parseInt(ticket.id.slice(-3), 10) || 1;

    return sucursales[(numero - 1) % sucursales.length];
  }

  etiquetaPrioridad(prioridad: string): string {
    if (prioridad === 'Alta') return 'P1 Alta';
    if (prioridad === 'Media') return 'P2 Media';

    return 'P3 Baja';
  }

  etiquetaEstado(estado: string): string {
    if (estado === 'Abierto') return 'Nuevo';
    if (estado === 'En progreso') return 'En progreso';

    return 'Resuelto';
  }

  textoSLA(ticket: Ticket): string {
    if (ticket.estado === 'Resuelto') {
      return 'Resuelto · SLA cumplido';
    }

    if (ticket.prioridad === 'Alta' && ticket.estado === 'Abierto') {
      return 'Vencido · revisar';
    }

    if (ticket.prioridad === 'Alta') {
      return 'Resolución · 42 min';
    }

    if (ticket.prioridad === 'Media') {
      return 'Resolución · 1 h 50 min';
    }

    return '1ª respuesta · 3 h';
  }

  progresoSLA(ticket: Ticket): number {
    if (ticket.estado === 'Resuelto') return 30;

    if (ticket.prioridad === 'Alta' && ticket.estado === 'Abierto') {
      return 100;
    }

    if (ticket.prioridad === 'Alta') return 80;
    if (ticket.prioridad === 'Media') return 45;

    return 20;
  }

  actividadTicket(ticket: Ticket): string {
    const numero = parseInt(ticket.id.slice(-3), 10) || 1;

    return `hace ${numero * 3} min`;
  }

  exportarVista() {
    const encabezado = [
      'ID', 'Título', 'Solicitante', 'Prioridad',
      'Estado', 'Agente', 'Fecha'
    ];

    const filas = this.ticketsFiltrados().map(ticket => [
      ticket.id,
      ticket.titulo,
      ticket.solicitante,
      ticket.prioridad,
      ticket.estado,
      ticket.agente,
      ticket.fecha
    ]);

    const escapar = (valor: string) =>
      `"${String(valor).replace(/"/g, '""')}"`;

    const csv = [encabezado, ...filas]
      .map(fila => fila.map(escapar).join(','))
      .join('\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'sildra-tickets.csv';
    enlace.click();

    URL.revokeObjectURL(url);
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

    const siguienteNumero =
      Math.max(
        0,
        ...this.tickets.map(ticket =>
          parseInt(ticket.id.replace('#TK-', ''), 10) || 0
        )
      ) + 1;

    const nuevo: Ticket = {
      id: '#TK-' + String(siguienteNumero).padStart(3, '0'),
      titulo: this.nuevoTicket.titulo.trim(),
      descripcion: this.nuevoTicket.descripcion.trim(),
      solicitante: this.nuevoTicket.solicitante.trim(),
      prioridad: this.nuevoTicket.prioridad,
      estado: 'Abierto',
      agente: 'Sin asignar',
      fecha: new Date().toLocaleDateString('es-DO')
    };

    this.tickets.unshift(nuevo);

    this.nuevoTicket = {
      titulo: '',
      descripcion: '',
      solicitante: '',
      prioridad: 'Media'
    };

    this.paginaActual = 1;
    this.activeTab = 'Mis tickets';
    this.mostrarFormulario = false;
  }
}