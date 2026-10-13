
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Prioridad = 'P1' | 'P2' | 'P3';
type Estado = 'Abierto' | 'En progreso' | 'Pendiente' | 'Resuelto';

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  solicitante: string;
  email: string;
  organizacion: string;
  sucursal: string;
  categoria: string;
  prioridad: Prioridad;
  estado: Estado;
  agente: string;
  cola: string;
  canal: string;
  creado: string;
  slaHoras: number;
  slaRestante: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html'
})
export class App {
  secciones = [
    { nombre: 'Bandeja de tickets', icono: '▤', grupo: 'Tickets' },
    { nombre: 'Detalle de ticket', icono: '▣', grupo: 'Tickets' },
    { nombre: 'Crear ticket', icono: '+', grupo: 'Tickets' },
    { nombre: 'Asignar tickets', icono: '⇄', grupo: 'Tickets' },
    { nombre: 'Panel de operación', icono: '▦', grupo: 'Operación' },
    { nombre: 'Prioridad, SLA y colas', icono: '◷', grupo: 'Operación' },
    { nombre: 'Perfil del usuario', icono: '◎', grupo: 'Cuenta' }
  ];

  activeTab = 'Bandeja de tickets';

  agentes = ['María', 'Carlos', 'Luis', 'Ana', 'Sin asignar'];
  prioridades: Prioridad[] = ['P1', 'P2', 'P3'];
  estados: Estado[] = ['Abierto', 'En progreso', 'Pendiente', 'Resuelto'];

  categorias = [
    'Hardware',
    'Software',
    'Redes',
    'Telefonía',
    'Accesos',
    'Otro'
  ];

  colas = [
    'Soporte técnico',
    'Infraestructura',
    'Telefonía',
    'Aplicaciones',
    'Accesos'
  ];

  tickets: Ticket[] = [
    {
      id: 'TK-1001',
      titulo: 'Teléfono IP sin conexión',
      descripcion: 'El teléfono IP de recepción perdió la conexión con el servidor de telefonía.',
      solicitante: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal principal',
      categoria: 'Telefonía',
      prioridad: 'P1',
      estado: 'Abierto',
      agente: 'María',
      cola: 'Telefonía',
      canal: 'Teléfono',
      creado: '2026-10-13T08:15:00',
      slaHoras: 4,
      slaRestante: 1
    },
    {
      id: 'TK-1002',
      titulo: 'No puedo acceder al correo',
      descripcion: 'El usuario recibe un error de autenticación al iniciar sesión en el correo corporativo.',
      solicitante: 'Laura Gómez',
      email: 'laura.gomez@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal norte',
      categoria: 'Accesos',
      prioridad: 'P2',
      estado: 'En progreso',
      agente: 'Carlos',
      cola: 'Accesos',
      canal: 'Correo',
      creado: '2026-10-13T07:30:00',
      slaHoras: 8,
      slaRestante: 5
    },
    {
      id: 'TK-1003',
      titulo: 'Computadora demasiado lenta',
      descripcion: 'La computadora tarda varios minutos en iniciar y abrir las aplicaciones.',
      solicitante: 'Pedro Castillo',
      email: 'pedro.castillo@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal sur',
      categoria: 'Hardware',
      prioridad: 'P3',
      estado: 'Pendiente',
      agente: 'Luis',
      cola: 'Soporte técnico',
      canal: 'Portal',
      creado: '2026-10-12T15:20:00',
      slaHoras: 24,
      slaRestante: 16
    },
    {
      id: 'TK-1004',
      titulo: 'Falla en la conexión de red',
      descripcion: 'Varios equipos de la oficina no tienen acceso a la red interna.',
      solicitante: 'Ana Rodríguez',
      email: 'ana.rodriguez@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal principal',
      categoria: 'Redes',
      prioridad: 'P1',
      estado: 'En progreso',
      agente: 'Carlos',
      cola: 'Infraestructura',
      canal: 'Teléfono',
      creado: '2026-10-12T14:00:00',
      slaHoras: 4,
      slaRestante: -1
    },
    {
      id: 'TK-1005',
      titulo: 'Instalación de programa',
      descripcion: 'Se necesita instalar una herramienta de trabajo autorizada.',
      solicitante: 'Miguel Santos',
      email: 'miguel.santos@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal este',
      categoria: 'Software',
      prioridad: 'P3',
      estado: 'Abierto',
      agente: 'Sin asignar',
      cola: 'Aplicaciones',
      canal: 'Portal',
      creado: '2026-10-13T06:45:00',
      slaHoras: 24,
      slaRestante: 20
    },
    {
      id: 'TK-1006',
      titulo: 'Impresora no responde',
      descripcion: 'La impresora compartida aparece desconectada en los equipos de contabilidad.',
      solicitante: 'Carmen Díaz',
      email: 'carmen.diaz@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal norte',
      categoria: 'Hardware',
      prioridad: 'P2',
      estado: 'Abierto',
      agente: 'María',
      cola: 'Soporte técnico',
      canal: 'Correo',
      creado: '2026-10-12T12:10:00',
      slaHoras: 8,
      slaRestante: 3
    },
    {
      id: 'TK-1007',
      titulo: 'Error al abrir el sistema',
      descripcion: 'La aplicación interna muestra un mensaje de error al intentar abrirla.',
      solicitante: 'José Ramírez',
      email: 'jose.ramirez@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal principal',
      categoria: 'Software',
      prioridad: 'P2',
      estado: 'Pendiente',
      agente: 'Ana',
      cola: 'Aplicaciones',
      canal: 'Portal',
      creado: '2026-10-11T10:00:00',
      slaHoras: 8,
      slaRestante: 2
    },
    {
      id: 'TK-1008',
      titulo: 'Solicitud de acceso a carpeta',
      descripcion: 'El empleado necesita permisos para consultar una carpeta compartida.',
      solicitante: 'Sofía Martínez',
      email: 'sofia.martinez@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal sur',
      categoria: 'Accesos',
      prioridad: 'P3',
      estado: 'Resuelto',
      agente: 'Luis',
      cola: 'Accesos',
      canal: 'Correo',
      creado: '2026-10-10T09:30:00',
      slaHoras: 24,
      slaRestante: 12
    },
    {
      id: 'TK-1009',
      titulo: 'Audio intermitente en llamadas',
      descripcion: 'Las llamadas presentan cortes de audio durante la conversación.',
      solicitante: 'Daniel Herrera',
      email: 'daniel.herrera@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal este',
      categoria: 'Telefonía',
      prioridad: 'P1',
      estado: 'Abierto',
      agente: 'Sin asignar',
      cola: 'Telefonía',
      canal: 'Teléfono',
      creado: '2026-10-13T08:45:00',
      slaHoras: 4,
      slaRestante: 2
    },
    {
      id: 'TK-1010',
      titulo: 'Actualización de equipo',
      descripcion: 'Solicitud para actualizar el sistema operativo de una computadora.',
      solicitante: 'Elena Cruz',
      email: 'elena.cruz@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal principal',
      categoria: 'Software',
      prioridad: 'P3',
      estado: 'Resuelto',
      agente: 'Carlos',
      cola: 'Soporte técnico',
      canal: 'Portal',
      creado: '2026-10-09T11:20:00',
      slaHoras: 24,
      slaRestante: 18
    },
    {
      id: 'TK-1011',
      titulo: 'Acceso bloqueado al sistema',
      descripcion: 'La cuenta del empleado se encuentra bloqueada después de varios intentos.',
      solicitante: 'Ricardo Núñez',
      email: 'ricardo.nunez@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal norte',
      categoria: 'Accesos',
      prioridad: 'P2',
      estado: 'En progreso',
      agente: 'Ana',
      cola: 'Accesos',
      canal: 'Correo',
      creado: '2026-10-12T16:10:00',
      slaHoras: 8,
      slaRestante: 4
    },
    {
      id: 'TK-1012',
      titulo: 'Punto de red sin servicio',
      descripcion: 'El punto de red de un puesto de trabajo no detecta conexión.',
      solicitante: 'Gabriel Torres',
      email: 'gabriel.torres@empresa.com',
      organizacion: 'Empresa Central',
      sucursal: 'Sucursal sur',
      categoria: 'Redes',
      prioridad: 'P2',
      estado: 'Abierto',
      agente: 'María',
      cola: 'Infraestructura',
      canal: 'Portal',
      creado: '2026-10-13T07:10:00',
      slaHoras: 8,
      slaRestante: 6
    }
  ];

  busqueda = '';
  filtroEstado = '';
  filtroPrioridad = '';
  filtroAgente = '';
  filtroCola = '';

  paginaActual = 1;
  ticketsPorPagina = 6;

  mostrarFormulario = false;
  mostrarDetalle = false;
  mostrarAsignacion = false;

  ticketSeleccionado: Ticket | null = null;
  agenteSeleccionado = '';

  nuevoTicket: Ticket = this.formularioVacio();

  perfil = {
    nombre: 'Nelson Mejía',
    email: 'nelson@empresa.com',
    cargo: 'Agente de soporte',
    departamento: 'Soporte técnico',
    telefono: '',
    zonaHoraria: 'America/Santo_Domingo',
    notificaciones: true
  };

  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';

  formularioVacio(): Ticket {
    return {
      id: '',
      titulo: '',
      descripcion: '',
      solicitante: '',
      email: '',
      organizacion: '',
      sucursal: '',
      categoria: 'Software',
      prioridad: 'P2',
      estado: 'Abierto',
      agente: 'Sin asignar',
      cola: 'Soporte técnico',
      canal: 'Portal',
      creado: new Date().toISOString(),
      slaHoras: 8,
      slaRestante: 8
    };
  }

  cambiarPestana(nombre: string): void {
    this.activeTab = nombre;
    this.mostrarDetalle = false;
    this.mostrarAsignacion = false;
    this.mostrarFormulario = nombre === 'Crear ticket';

    if (nombre === 'Detalle de ticket' && !this.ticketSeleccionado) {
      this.ticketSeleccionado = this.tickets[0] ?? null;
    }

    if (nombre === 'Crear ticket') {
      this.nuevoTicket = this.formularioVacio();
    }
  }

  ticketsFiltrados(): Ticket[] {
    const texto = this.busqueda.toLowerCase().trim();

    return this.tickets.filter(ticket => {
      const coincideTexto =
        !texto ||
        ticket.id.toLowerCase().includes(texto) ||
        ticket.titulo.toLowerCase().includes(texto) ||
        ticket.solicitante.toLowerCase().includes(texto) ||
        ticket.email.toLowerCase().includes(texto);

      const coincideEstado =
        !this.filtroEstado || ticket.estado === this.filtroEstado;

      const coincidePrioridad =
        !this.filtroPrioridad || ticket.prioridad === this.filtroPrioridad;

      const coincideAgente =
        !this.filtroAgente || ticket.agente === this.filtroAgente;

      const coincideCola =
        !this.filtroCola || ticket.cola === this.filtroCola;

      return (
        coincideTexto &&
        coincideEstado &&
        coincidePrioridad &&
        coincideAgente &&
        coincideCola
      );
    });
  }

  ticketsPaginados(): Ticket[] {
    const inicio = (this.paginaActual - 1) * this.ticketsPorPagina;

    return this.ticketsFiltrados().slice(
      inicio,
      inicio + this.ticketsPorPagina
    );
  }

  totalPaginas(): number {
    return Math.max(
      1,
      Math.ceil(this.ticketsFiltrados().length / this.ticketsPorPagina)
    );
  }

  finPagina(): number {
    return Math.min(
      this.paginaActual * this.ticketsPorPagina,
      this.ticketsFiltrados().length
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual = pagina;
    }
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = '';
    this.filtroPrioridad = '';
    this.filtroAgente = '';
    this.filtroCola = '';
    this.paginaActual = 1;
  }

  abrirFormulario(): void {
    this.nuevoTicket = this.formularioVacio();
    this.mostrarFormulario = true;
    this.activeTab = 'Crear ticket';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.activeTab = 'Bandeja de tickets';
  }

  crearTicket(): void {
    if (
      !this.nuevoTicket.titulo.trim() ||
      !this.nuevoTicket.descripcion.trim() ||
      !this.nuevoTicket.solicitante.trim() ||
      !this.nuevoTicket.email.trim()
    ) {
      this.mostrarMensaje('Completa los campos obligatorios', 'error');
      return;
    }

    const siguienteNumero =
      Math.max(
        1000,
        ...this.tickets.map(ticket => Number(ticket.id.replace('TK-', '')) || 0)
      ) + 1;

    const ticketCreado: Ticket = {
      ...this.nuevoTicket,
      id: `TK-${siguienteNumero}`,
      creado: new Date().toISOString(),
      slaRestante: this.nuevoTicket.slaHoras
    };

    this.tickets.unshift(ticketCreado);
    this.ticketSeleccionado = ticketCreado;
    this.nuevoTicket = this.formularioVacio();
    this.mostrarFormulario = false;
    this.activeTab = 'Detalle de ticket';
    this.paginaActual = 1;

    this.mostrarMensaje('Ticket creado correctamente');
  }

  abrirDetalle(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.mostrarDetalle = true;
    this.mostrarAsignacion = false;
  }

  verDetalleDesdeSeccion(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.mostrarDetalle = false;
    this.mostrarAsignacion = false;
    this.activeTab = 'Detalle de ticket';
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
  }

  guardarCambiosDetalle(): void {
    if (!this.ticketSeleccionado) {
      return;
    }

    this.mostrarMensaje('Cambios del ticket guardados correctamente');
    this.mostrarDetalle = false;
  }

  resolverTicket(ticket: Ticket): void {
    ticket.estado = 'Resuelto';
    this.mostrarMensaje(`${ticket.id} marcado como resuelto`);
  }

  reabrirTicket(ticket: Ticket): void {
    ticket.estado = 'Abierto';
    this.mostrarMensaje(`${ticket.id} reabierto correctamente`);
  }

  abrirAsignacion(ticket: Ticket): void {
    this.ticketSeleccionado = ticket;
    this.agenteSeleccionado = ticket.agente;
    this.mostrarAsignacion = true;
    this.mostrarDetalle = false;
  }

  asignarAgente(): void {
    if (!this.ticketSeleccionado || !this.agenteSeleccionado) {
      this.mostrarMensaje('Selecciona un agente', 'error');
      return;
    }

    this.ticketSeleccionado.agente = this.agenteSeleccionado;
    this.mostrarAsignacion = false;

    this.mostrarMensaje(
      `Ticket ${this.ticketSeleccionado.id} asignado a ${this.agenteSeleccionado}`
    );
  }

  ticketsSinAsignar(): Ticket[] {
    return this.tickets.filter(
      ticket =>
        ticket.agente === 'Sin asignar' &&
        ticket.estado !== 'Resuelto'
    );
  }

  ticketsActivos(): Ticket[] {
    return this.tickets.filter(ticket => ticket.estado !== 'Resuelto');
  }

  ticketsResueltos(): Ticket[] {
    return this.tickets.filter(ticket => ticket.estado === 'Resuelto');
  }

  ticketsVencidos(): Ticket[] {
    return this.tickets.filter(
      ticket =>
        ticket.estado !== 'Resuelto' &&
        ticket.slaRestante <= 0
    );
  }

  ticketsPorPrioridad(prioridad: Prioridad): Ticket[] {
    return this.tickets.filter(
      ticket =>
        ticket.prioridad === prioridad &&
        ticket.estado !== 'Resuelto'
    );
  }

  ticketsPorCola(cola: string): Ticket[] {
    return this.tickets.filter(
      ticket =>
        ticket.cola === cola &&
        ticket.estado !== 'Resuelto'
    );
  }

  ticketsPorEstado(estado: Estado): Ticket[] {
    return this.tickets.filter(ticket => ticket.estado === estado);
  }

  ticketsDeAtencion(): Ticket[] {
    return this.tickets
      .filter(
        ticket =>
          ticket.estado !== 'Resuelto' &&
          (ticket.prioridad === 'P1' || ticket.slaRestante <= 2)
      )
      .sort((a, b) => a.slaRestante - b.slaRestante);
  }

  ticketsSlaFiltrados(): Ticket[] {
    return this.tickets
      .filter(ticket => {
        return (
          ticket.estado !== 'Resuelto' &&
          (!this.filtroPrioridad ||
            ticket.prioridad === this.filtroPrioridad)
        );
      })
      .sort((a, b) => a.slaRestante - b.slaRestante);
  }

  cantidadPorAgente(agente: string): number {
    return this.tickets.filter(
      ticket =>
        ticket.agente === agente &&
        ticket.estado !== 'Resuelto'
    ).length;
  }

  porcentajeAgente(agente: string): number {
    const total = this.ticketsActivos().length;

    if (total === 0) {
      return 0;
    }

    return Math.round((this.cantidadPorAgente(agente) / total) * 100);
  }

  porcentajeEstado(estado: Estado): number {
    const total = this.tickets.length;

    if (total === 0) {
      return 0;
    }

    return Math.round((this.ticketsPorEstado(estado).length / total) * 100);
  }

  porcentajeSla(ticket: Ticket): number {
    if (ticket.slaHoras <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(100, (ticket.slaRestante / ticket.slaHoras) * 100)
    );
  }

  claseSla(ticket: Ticket): string {
    if (ticket.slaRestante <= 0) {
      return 'sla-danger';
    }

    if (ticket.slaRestante <= 2) {
      return 'sla-warning';
    }

    return 'sla-good';
  }

  textoSla(ticket: Ticket): string {
    if (ticket.slaRestante < 0) {
      return `Vencido hace ${Math.abs(ticket.slaRestante)} h`;
    }

    if (ticket.slaRestante === 0) {
      return 'Vence ahora';
    }

    return `${ticket.slaRestante} h restantes`;
  }

  clasePrioridad(prioridad: Prioridad): string {
    switch (prioridad) {
      case 'P1':
        return 'priority-high';
      case 'P2':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  }

  claseEstado(estado: Estado): string {
    switch (estado) {
      case 'Abierto':
        return 'status-open';
      case 'En progreso':
        return 'status-progress';
      case 'Pendiente':
        return 'status-pending';
      case 'Resuelto':
        return 'status-resolved';
    }
  }

  formatearFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(fecha));
  }

  guardarPerfil(): void {
    if (!this.perfil.nombre.trim() || !this.perfil.email.trim()) {
      this.mostrarMensaje('El nombre y el correo son obligatorios', 'error');
      return;
    }

    this.mostrarMensaje('Perfil actualizado correctamente');
  }

  mostrarMensaje(
    mensaje: string,
    tipo: 'success' | 'error' = 'success'
  ): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
  }

  cerrarMensaje(): void {
    this.mensaje = '';
  }

  exportarCSV(): void {
    const encabezados = [
      'ID',
      'Título',
      'Solicitante',
      'Correo',
      'Categoría',
      'Prioridad',
      'Estado',
      'Agente',
      'Cola',
      'Canal',
      'Fecha de creación',
      'SLA restante'
    ];

    const filas = this.ticketsFiltrados().map(ticket => [
      ticket.id,
      ticket.titulo,
      ticket.solicitante,
      ticket.email,
      ticket.categoria,
      ticket.prioridad,
      ticket.estado,
      ticket.agente,
      ticket.cola,
      ticket.canal,
      ticket.creado,
      `${ticket.slaRestante} horas`
    ]);

    const escaparCSV = (valor: string | number): string => {
      return `"${String(valor).replace(/"/g, '""')}"`;
    };

    const contenido = [
      encabezados.map(escaparCSV).join(','),
      ...filas.map(fila => fila.map(escaparCSV).join(','))
    ].join('\r\n');

    const archivo = new Blob(
      ['\uFEFF', contenido],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'sildra-tickets.csv';
    enlace.click();

    URL.revokeObjectURL(url);

    this.mostrarMensaje('Archivo CSV exportado correctamente');
  }
}