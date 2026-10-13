
import { Component, HostListener } from '@angular/core';
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

interface Comando {
  titulo: string;
  descripcion: string;
  palabras: string;
  accion: string;
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

  // Estado de la paleta de comandos
  comandosAbiertos = false;
  busquedaComando = '';
  indiceComando = 0;

  comandos: Comando[] = [
    {
      titulo: 'Bandeja de tickets',
      descripcion: 'Volver al panel principal',
      palabras: 'inicio dashboard principal bandeja',
      accion: 'bandeja'
    },
    {
      titulo: 'Gestión de tickets',
      descripcion: 'Consultar todos los tickets',
      palabras: 'tickets solicitudes gestión',
      accion: 'tickets'
    },
    {
      titulo: 'Detalles de llamadas',
      descripcion: 'Consultar los detalles de una llamada',
      palabras: 'llamadas detalle llamada',
      accion: 'detalle'
    },
    {
      titulo: 'Transferencia cálida entrante',
      descripcion: 'Abrir la pantalla de transferencias',
      palabras: 'transferencia cálida entrante llamadas',
      accion: 'transferencia'
    },
    {
      titulo: 'Base de conocimiento',
      descripcion: 'Consultar artículos de ayuda',
      palabras: 'base conocimiento artículos kb',
      accion: 'articulos'
    },
    {
      titulo: 'Nuevo artículo KB',
      descripcion: 'Crear un artículo de conocimiento',
      palabras: 'nuevo crear artículo kb',
      accion: 'nuevo'
    },
    {
      titulo: 'Revisión de artículos',
      descripcion: 'Aprobar o rechazar artículos',
      palabras: 'revisión revisar aprobar rechazar artículos',
      accion: 'revision'
    }
  ];

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
      solicitante: 'La página tarda en cargar',
      prioridad: 'Alta',
      estado: 'Abierto',
      agente: 'Agente 2',
      fecha: '12/10/2026'
    }
  ];

  constructor(private router: Router) {}

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  irABandeja(): void {
    this.seccionActual = 'dashboard';
    this.mostrarBandeja = true;
    this.mostrarFormulario = false;
    this.router.navigateByUrl('/');
  }

  irATickets(): void {
    this.seccionActual = 'tickets';
    this.mostrarBandeja = true;
    this.mostrarFormulario = false;
    this.router.navigateByUrl('/');
  }

  irADetallesLlamadas(): void {
    this.seccionActual = 'llamadas';
    this.mostrarBandeja = false;
    this.mostrarFormulario = false;
    this.router.navigateByUrl('/llamadas/detalle');
  }

  irATransferenciaCalida(): void {
    this.seccionActual = 'transferencia';
    this.mostrarBandeja = false;
    this.mostrarFormulario = false;
    this.router.navigateByUrl('/llamadas/transferencia');
  }

  irAArticulosKB(): void {
    this.seccionActual = 'kb-list';
    this.mostrarBandeja = false;
    this.mostrarFormulario = false;
    this.router.navigateByUrl('/conocimiento/articulos');
  }

  irANuevoArticuloKB(): void {
    this.seccionActual = 'kb-new-article';
    this.mostrarBandeja = false;
    this.mostrarFormulario = false;
    this.router.navigateByUrl('/conocimiento/nuevo');
  }

  irARevisionKB(): void {
    this.seccionActual = 'kb-review';
    this.mostrarBandeja = false;
    this.mostrarFormulario = false;
    this.router.navigateByUrl('/conocimiento/revision');
  }

  // ==========================================
  // PALETA DE COMANDOS
  // ==========================================

  get comandosFiltrados(): Comando[] {
    const texto = this.busquedaComando.trim().toLowerCase();

    if (!texto) {
      return this.comandos;
    }

    return this.comandos.filter(comando =>
      `${comando.titulo} ${comando.descripcion} ${comando.palabras}`
        .toLowerCase()
        .includes(texto)
    );
  }

  abrirComandos(): void {
    this.comandosAbiertos = true;
    this.busquedaComando = '';
    this.indiceComando = 0;
  }

  cerrarComandos(): void {
    this.comandosAbiertos = false;
    this.busquedaComando = '';
    this.indiceComando = 0;
  }

  @HostListener('document:keydown', ['$event'])
  manejarAtajos(event: KeyboardEvent): void {
    const tecla = event.key.toLowerCase();

    // Ctrl + K en Windows y Command + K en Mac.
    if ((event.ctrlKey || event.metaKey) && tecla === 'k') {
      event.preventDefault();

      if (this.comandosAbiertos) {
        this.cerrarComandos();
      } else {
        this.abrirComandos();
      }

      return;
    }

    // Cerrar la paleta con Escape.
    if (this.comandosAbiertos && event.key === 'Escape') {
      event.preventDefault();
      this.cerrarComandos();
      return;
    }

    // Atajos Alt + número, cuando la paleta está cerrada.
    if (
      !this.comandosAbiertos &&
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      switch (event.key) {
        case '1':
          event.preventDefault();
          this.irABandeja();
          break;
        case '2':
          event.preventDefault();
          this.irATickets();
          break;
        case '3':
          event.preventDefault();
          this.irADetallesLlamadas();
          break;
        case '4':
          event.preventDefault();
          this.irATransferenciaCalida();
          break;
        case '5':
          event.preventDefault();
          this.irAArticulosKB();
          break;
        case '6':
          event.preventDefault();
          this.irANuevoArticuloKB();
          break;
        case '7':
          event.preventDefault();
          this.irARevisionKB();
          break;
      }

      return;
    }

    if (!this.comandosAbiertos) {
      return;
    }

    // Flecha abajo.
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (this.comandosFiltrados.length > 0) {
        this.indiceComando =
          (this.indiceComando + 1) % this.comandosFiltrados.length;
      }

      return;
    }

    // Flecha arriba.
    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (this.comandosFiltrados.length > 0) {
        this.indiceComando =
          (this.indiceComando - 1 + this.comandosFiltrados.length) %
          this.comandosFiltrados.length;
      }

      return;
    }

    // Ejecutar con Enter.
    if (event.key === 'Enter' && this.comandosFiltrados.length > 0) {
      event.preventDefault();

      const comando = this.comandosFiltrados[this.indiceComando];

      if (comando) {
        this.ejecutarComando(comando.accion);
      }
    }
  }

  ejecutarComando(accion: string): void {
    this.cerrarComandos();

    switch (accion) {
      case 'bandeja':
        this.irABandeja();
        break;

      case 'tickets':
        this.irATickets();
        break;

      case 'detalle':
        this.irADetallesLlamadas();
        break;

      case 'transferencia':
        this.irATransferenciaCalida();
        break;

      case 'articulos':
        this.irAArticulosKB();
        break;

      case 'nuevo':
        this.irANuevoArticuloKB();
        break;

      case 'revision':
        this.irARevisionKB();
        break;
    }
  }

  // ==========================================
  // FILTROS Y CONTADORES DE TICKETS
  // ==========================================

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

  contarEstado(estado: string): number {
    return this.tickets.filter(
      ticket => ticket.estado === estado
    ).length;
  }

  // ==========================================
  // CREACIÓN DE TICKETS
  // ==========================================

  abrirFormulario(): void {
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

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
