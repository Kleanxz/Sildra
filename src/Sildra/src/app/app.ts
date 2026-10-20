import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom, Subscription } from 'rxjs';

import { UserAccessPageComponent } from './features/administration/pages/user-access/user-access-page.component';
import { ArticleApprovalPageComponent } from './features/knowledge/pages/article-approval/article-approval-page.component';
import { ArticleEditorPageComponent } from './features/knowledge/pages/article-editor/article-editor-page.component';
import { ArticleRejectionPageComponent } from './features/knowledge/pages/article-rejection/article-rejection-page.component';
import { KnowledgeBasePageComponent } from './features/knowledge/pages/knowledge-base/knowledge-base-page.component';
import { OperationsDashboardPageComponent } from './features/operations/pages/operations-dashboard/operations-dashboard-page.component';
import { SlaQueuesPageComponent } from './features/operations/pages/sla-queues/sla-queues-page.component';
import { OrganizationManagementPageComponent } from './features/organizations/pages/organization-management/organization-management-page.component';
import { UserProfilePageComponent } from './features/profile/pages/user-profile/user-profile-page.component';
import { ClassificationReviewPageComponent } from './features/quality/pages/classification-review/classification-review-page.component';
import { CallDetailsPageComponent } from './features/telephony/pages/call-details/call-details-page.component';
import { IncomingHandoffsPageComponent } from './features/telephony/pages/incoming-handoffs/incoming-handoffs-page.component';
import { AssignTicketsPageComponent } from './features/tickets/pages/assign-tickets/assign-tickets-page.component';
import { CreateTicketPageComponent } from './features/tickets/pages/create-ticket/create-ticket-page.component';
import { ResolveTicketsPageComponent } from './features/tickets/pages/resolve-tickets/resolve-tickets-page.component';

import { AppHeaderComponent } from './core/layout/app-header/app-header.component';
import { AppSidebarComponent } from './core/layout/app-sidebar/app-sidebar.component';
import { AuthViewComponent } from './features/authentication/components/auth-view/auth-view.component';
import { ResolvedTicketsComponent } from './features/tickets/components/resolved-tickets/resolved-tickets.component';
import { TicketDetailComponent } from './features/tickets/components/ticket-detail/ticket-detail.component';
import { TicketInboxComponent } from './features/tickets/components/ticket-inbox/ticket-inbox.component';
import { ApiService } from './core/http/api.service';
import { sectionRoutePaths } from './core/routing/app.routes';
import {
  Agent,
  ApiFailure,
  ApiTicket,
  CallSession,
  Estado,
  KnowledgeArticle,
  ManagedUser,
  NavigationSection,
  Organization,
  Prioridad,
  SessionUser,
  Ticket,
  TicketChatMessage,
  WarmHandoff,
} from './shared/models';
import {
  claseSla as calcularClaseSla,
  formatearFecha as formatearFechaUI,
  porcentajeSla as calcularPorcentajeSla,
  textoSla as construirTextoSla,
} from './shared/utils/ticket-presentation';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    AppHeaderComponent,
    AppSidebarComponent,
    AuthViewComponent,
    ResolvedTicketsComponent,
    TicketDetailComponent,
    TicketInboxComponent,
    UserAccessPageComponent,
    ArticleApprovalPageComponent,
    ArticleEditorPageComponent,
    ArticleRejectionPageComponent,
    KnowledgeBasePageComponent,
    OperationsDashboardPageComponent,
    SlaQueuesPageComponent,
    OrganizationManagementPageComponent,
    UserProfilePageComponent,
    ClassificationReviewPageComponent,
    CallDetailsPageComponent,
    IncomingHandoffsPageComponent,
    AssignTicketsPageComponent,
    CreateTicketPageComponent,
    ResolveTicketsPageComponent,
  ],
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  constructor(
    private readonly changeDetector: ChangeDetectorRef,
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  secciones: NavigationSection[] = [
    { nombre: 'Bandeja de tickets', icono: '▤', grupo: 'Tickets' },
    { nombre: 'Tickets resueltos', icono: '✓', grupo: 'Tickets' },
    { nombre: 'Detalle de ticket', icono: '▣', grupo: 'Tickets' },
    { nombre: 'Crear ticket', icono: '+', grupo: 'Tickets' },
    { nombre: 'Resolver tickets', icono: '✓', grupo: 'Tickets' },
    { nombre: 'Asignar tickets', icono: '⇄', grupo: 'Tickets' },
    { nombre: 'Detalle de llamada', icono: 'call', grupo: 'Telefonía' },
    { nombre: 'Transferencia cálida entrante', icono: '⇢', grupo: 'Telefonía' },
    { nombre: 'Revisión de clasificación', icono: '⌕', grupo: 'Calidad' },
    { nombre: 'Base de conocimiento', icono: '▧', grupo: 'Conocimiento' },
    { nombre: 'Nuevo artículo KB', icono: '＋', grupo: 'Conocimiento' },
    { nombre: 'Aprobar artículo KB', icono: '✓', grupo: 'Conocimiento' },
    { nombre: 'Rechazar artículo KB', icono: '×', grupo: 'Conocimiento' },
    { nombre: 'Panel de operación', icono: '▦', grupo: 'Operación' },
    { nombre: 'Prioridad, SLA y colas', icono: '◷', grupo: 'Operación' },
    { nombre: 'Organizaciones', icono: '⌂', grupo: 'Administración' },
    { nombre: 'Permisos de usuarios', icono: '♙', grupo: 'Administración' },
    { nombre: 'Perfil del usuario', icono: '◎', grupo: 'Cuenta' },
  ];

  activeTab = 'Bandeja de tickets';

  agentes: Agent[] = [];
  usuariosAdministrables: ManagedUser[] = [];
  llamadas: CallSession[] = [];
  llamadaSeleccionada: CallSession | null = null;
  transferencias: WarmHandoff[] = [];
  articulosKB: KnowledgeArticle[] = [];
  categoriaEdicion: Record<string, string> = {};
  comentarioRechazo: Record<string, string> = {};
  transferenciaNueva = { ticketId: '', queueRef: 'Soporte', extensionRef: '', reason: '' };
  articuloNuevo = {
    title: '',
    content: '',
    productCode: '',
    moduleCode: '',
    language: 'es',
    audience: 'support',
  };
  ticketResolucion: Ticket | null = null;
  notasResolucion = '';
  mostrarResolucion = false;
  mostrarPaletaComandos = false;
  busquedaComandos = '';
  buscarKB = '';
  prioridades: Prioridad[] = ['P1', 'P2', 'P3'];
  estados: Estado[] = ['Abierto', 'En progreso', 'Pendiente', 'Resuelto'];

  categorias = ['Hardware', 'Software', 'Redes', 'Telefonía', 'Accesos', 'Otro'];

  colas = ['Soporte técnico', 'Infraestructura', 'Telefonía', 'Aplicaciones', 'Accesos'];

  tickets: Ticket[] = [];
  organizaciones: Organization[] = [];
  nuevaOrganizacion = { nombre: '', sucursal: '' };
  usuarioActual: SessionUser | null = null;
  cargandoSesion = true;
  modoRegistro = false;
  errorAcceso = '';
  authForm = { nombre: '', email: '', password: '', organizacionId: '' };
  private relojActual = Date.now();
  private routeSubscription = new Subscription();
  private slaTimer: ReturnType<typeof setInterval> | undefined;
  private chatTimer: ReturnType<typeof setInterval> | undefined;
  private chatLoadVersion = 0;
  private chatTicketIdLoaded: string | null = null;

  busqueda = '';
  busquedaResueltos = '';
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
  mensajesChat: TicketChatMessage[] = [];
  nuevoMensajeChat = '';
  cargandoChat = false;
  enviandoChat = false;
  errorChat = '';

  nuevoTicket: Ticket = this.formularioVacio();

  perfil = {
    nombre: '',
    email: '',
    cargo: 'Usuario',
    departamento: 'Soporte técnico',
    telefono: '',
    zonaHoraria: 'America/Santo_Domingo',
    notificaciones: true,
  };

  mensaje = '';
  tipoMensaje: 'success' | 'error' | 'warning' = 'success';

  async ngOnInit(): Promise<void> {
    this.routeSubscription.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => this.sincronizarSeccionConRuta()),
    );

    this.slaTimer = setInterval(() => {
      this.relojActual = Date.now();
      this.actualizarSlaRestante();
      this.changeDetector.markForCheck();
    }, 1_000);
    this.chatTimer = setInterval(() => {
      if (this.usuarioActual && this.activeTab === 'Detalle de ticket' && this.ticketSeleccionado)
        void this.cargarMensajesChat(false);
    }, 5_000);

    try {
      const user = await this.api<SessionUser>('/auth/me');
      await this.iniciarSesionEnInterfaz(user);
    } catch (error) {
      if (this.estadoError(error) === 401) {
        try {
          this.organizaciones = await this.api<Organization[]>('/public/organizations');
        } catch (organizationError) {
          this.errorAcceso = this.mensajeError(
            organizationError,
            'No se pudieron cargar las organizaciones.',
          );
        }
      } else {
        this.errorAcceso = this.mensajeError(error, 'No se pudo conectar con el servicio.');
      }
    } finally {
      this.cargandoSesion = false;
      this.changeDetector.markForCheck();
    }
  }

  ngOnDestroy(): void {
    if (this.slaTimer) clearInterval(this.slaTimer);
    if (this.chatTimer) clearInterval(this.chatTimer);
    this.routeSubscription.unsubscribe();
  }

  private async api<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    try {
      return await firstValueFrom(this.apiService.request<T>(path, options));
    } finally {
      window.setTimeout(() => this.changeDetector.markForCheck(), 0);
    }
  }

  private estadoError(error: unknown): number | undefined {
    return (error as ApiFailure)?.status;
  }

  private mensajeError(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  async ingresar(): Promise<void> {
    this.errorAcceso = '';
    const esRegistro = this.modoRegistro;
    try {
      const endpoint = esRegistro ? '/auth/register' : '/auth/login';
      const body = esRegistro
        ? {
            name: this.authForm.nombre,
            email: this.authForm.email,
            password: this.authForm.password,
            organizationId: this.authForm.organizacionId,
          }
        : { email: this.authForm.email, password: this.authForm.password };
      const user = await this.api<SessionUser>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await this.iniciarSesionEnInterfaz(user);
      this.authForm.password = '';
      if (esRegistro) {
        this.mostrarMensaje(
          user.emailSent
            ? 'Cuenta creada. Enviamos un aviso de registro a tu correo.'
            : 'Cuenta creada. No se envió el correo porque falta configurar el servicio SMTP.',
          user.emailSent ? 'success' : 'warning',
        );
      }
    } catch (error) {
      this.errorAcceso =
        this.estadoError(error) === 401
          ? 'El correo o la contraseña no son correctos.'
          : this.mensajeError(error, 'No fue posible iniciar sesión.');
    }
  }

  cambiarModoAcceso(): void {
    this.modoRegistro = !this.modoRegistro;
    this.errorAcceso = '';
  }

  async cerrarSesion(): Promise<void> {
    try {
      await this.api('/auth/logout', { method: 'POST' });
    } catch {
      // Se limpia la interfaz incluso si la sesión ya venció.
    }
    this.usuarioActual = null;
    void this.router.navigateByUrl(sectionRoutePaths['Bandeja de tickets']);
    this.tickets = [];
    this.organizaciones = [];
    this.agentes = [];
    this.ticketSeleccionado = null;
    this.mensajesChat = [];
    this.nuevoMensajeChat = '';
    this.errorChat = '';
    this.chatLoadVersion++;
    this.chatTicketIdLoaded = null;
    this.mostrarFormulario = false;
    this.errorAcceso = '';
    this.authForm.password = '';
    try {
      this.organizaciones = await this.api<Organization[]>('/public/organizations');
    } catch {
      this.organizaciones = [];
    }
    this.changeDetector.markForCheck();
  }

  private async iniciarSesionEnInterfaz(user: SessionUser): Promise<void> {
    this.usuarioActual = user;
    this.perfil.nombre = user.name;
    this.perfil.email = user.email;
    this.perfil.cargo = user.isAdmin ? 'Administrador' : user.isAgent ? 'Agente' : 'Usuario';
    this.perfil.departamento = user.isAdmin
      ? 'Administración'
      : user.isAgent
        ? 'Atención de tickets'
        : 'Soporte técnico';
    this.activeTab = 'Bandeja de tickets';
    this.cargandoSesion = true;

    try {
      const [tickets, organizations] = await Promise.all([
        this.api<ApiTicket[]>('/tickets'),
        this.api<Organization[]>('/organizations'),
      ]);
      this.organizaciones = organizations;
      this.tickets = tickets.map((ticket) => this.convertirTicket(ticket));
      this.categoriaEdicion = Object.fromEntries(
        this.tickets.map((ticket) => [ticket.dbId, ticket.categoria]),
      );
      if (user.isAdmin) {
        const [agents, users] = await Promise.all([
          this.api<Agent[]>('/agents'),
          this.api<ManagedUser[]>('/users'),
        ]);
        this.agentes = agents;
        this.usuariosAdministrables = users;
      } else this.agentes = [];
      if (user.isAdmin || user.isAgent) {
        const [calls, handoffs, articles] = await Promise.all([
          this.api<CallSession[]>('/calls'),
          this.api<WarmHandoff[]>('/handoffs'),
          this.api<KnowledgeArticle[]>('/knowledge/articles'),
        ]);
        this.llamadas = calls;
        this.transferencias = handoffs;
        this.articulosKB = articles;
      } else {
        this.articulosKB = await this.api<KnowledgeArticle[]>('/knowledge/articles');
      }
      this.ticketSeleccionado = this.tickets[0] ?? null;
      this.actualizarSlaRestante();
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudieron cargar los tickets.'), 'error');
    } finally {
      this.cargandoSesion = false;
      this.sincronizarSeccionConRuta();
      this.changeDetector.markForCheck();
    }
  }

  private convertirTicket(source: ApiTicket): Ticket {
    const deadline = new Date(source.slaDeadline).getTime();
    const createdAt = new Date(source.createdAt).getTime();
    return {
      dbId: source.id,
      id: source.ticketNumber,
      titulo: source.subject,
      descripcion: source.description,
      solicitante: source.requesterName,
      email: source.requesterEmail,
      telefono: source.requesterPhone ?? '',
      organizacion: source.organization,
      organizacionId: '',
      sucursal: source.branch,
      categoria: source.category,
      prioridad: source.priority,
      estado: source.status,
      agente: source.agent,
      agenteId: source.assigneeId,
      cola: source.queue,
      canal: source.channel,
      creado: source.createdAt,
      slaHoras: Math.max(0, (deadline - createdAt) / 3_600_000),
      slaRestante: (deadline - this.relojActual) / 3_600_000,
      slaDeadline: source.slaDeadline,
      resolutionNotes: source.resolutionNotes ?? '',
    };
  }

  private actualizarSlaRestante(): void {
    for (const ticket of this.tickets) {
      ticket.slaRestante = ticket.slaDeadline
        ? (new Date(ticket.slaDeadline).getTime() - this.relojActual) / 3_600_000
        : 0;
    }
    if (this.ticketSeleccionado && !this.tickets.includes(this.ticketSeleccionado)) {
      this.ticketSeleccionado.slaRestante = this.ticketSeleccionado.slaDeadline
        ? (new Date(this.ticketSeleccionado.slaDeadline).getTime() - this.relojActual) / 3_600_000
        : 0;
    }
  }

  esAdmin(): boolean {
    return this.usuarioActual?.isAdmin === true;
  }

  esAgente(): boolean {
    return this.usuarioActual?.isAgent === true;
  }

  puedeAtender(): boolean {
    return this.esAdmin() || this.esAgente();
  }

  agenteVisible(ticket: Ticket): string {
    return !this.puedeAtender() && ticket.agente === 'Sin asignar'
      ? 'Equipo de soporte'
      : ticket.agente;
  }

  seccionesVisibles(): typeof this.secciones {
    const adminOnly = [
      'Asignar tickets',
      'Panel de operación',
      'Prioridad, SLA y colas',
      'Organizaciones',
      'Permisos de usuarios',
      'Aprobar artículo KB',
      'Rechazar artículo KB',
    ];
    const agentOrAdmin = [
      'Resolver tickets',
      'Detalle de llamada',
      'Transferencia cálida entrante',
      'Revisión de clasificación',
      'Nuevo artículo KB',
    ];
    return this.secciones.filter(
      (section) =>
        (!adminOnly.includes(section.nombre) || this.esAdmin()) &&
        (!agentOrAdmin.includes(section.nombre) || this.puedeAtender()),
    );
  }

  async guardarOrganizacion(): Promise<void> {
    if (!this.esAdmin() || !this.nuevaOrganizacion.nombre.trim()) return;
    try {
      const organization = await this.api<Organization>('/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: this.nuevaOrganizacion.nombre,
          branch: this.nuevaOrganizacion.sucursal,
        }),
      });
      this.organizaciones = [...this.organizaciones, organization].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      this.nuevaOrganizacion = { nombre: '', sucursal: '' };
      this.mostrarMensaje('Organización agregada correctamente');
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo guardar la organización.'), 'error');
    }
  }

  formularioVacio(): Ticket {
    return {
      dbId: '',
      id: '',
      titulo: '',
      descripcion: '',
      solicitante: '',
      email: '',
      telefono: '',
      organizacion: '',
      organizacionId: '',
      sucursal: '',
      categoria: 'Software',
      prioridad: 'P2',
      estado: 'Abierto',
      agente: 'Sin asignar',
      agenteId: null,
      cola: 'Soporte técnico',
      canal: 'Portal',
      creado: new Date().toISOString(),
      slaHoras: 8,
      slaRestante: 8,
      slaDeadline: null,
      resolutionNotes: '',
    };
  }

  cambiarPestana(nombre: string): void {
    if (!this.seccionesVisibles().some((section) => section.nombre === nombre)) return;
    this.seleccionarPestana(nombre);
    const path = this.rutaParaSeccion(nombre);
    if (path && this.router.url !== path) void this.router.navigateByUrl(path);
  }

  private seleccionarPestana(nombre: string): void {
    if (!this.seccionesVisibles().some((section) => section.nombre === nombre)) return;
    this.activeTab = nombre;
    this.mostrarDetalle = false;
    this.mostrarAsignacion = false;
    this.mostrarFormulario = nombre === 'Crear ticket';

    if (nombre === 'Detalle de ticket' && !this.ticketSeleccionado) {
      this.ticketSeleccionado = this.tickets[0] ?? null;
    }

    if (nombre === 'Detalle de ticket') void this.cargarMensajesChat();

    if (nombre === 'Crear ticket') {
      this.prepararFormulario();
    }
    if (nombre === 'Detalle de llamada') this.cargarLlamadas();
    if (nombre === 'Transferencia cálida entrante') this.cargarTransferencias();
    if (nombre.includes('artículo KB') || nombre === 'Base de conocimiento')
      this.cargarArticulosKB();
  }

  private sincronizarSeccionConRuta(): void {
    if (!this.usuarioActual || this.cargandoSesion) return;

    const route = this.router.routerState.snapshot.root.firstChild;
    const section = route?.data['section'];
    if (typeof section !== 'string') return;

    if (!this.seccionesVisibles().some((item) => item.nombre === section)) {
      const defaultPath = sectionRoutePaths['Bandeja de tickets'];
      if (defaultPath && this.router.url !== defaultPath)
        void this.router.navigateByUrl(defaultPath, { replaceUrl: true });
      return;
    }

    const ticketId = route?.paramMap.get('ticketId');
    if (section === 'Detalle de ticket' && ticketId) {
      const ticket = this.tickets.find((item) => item.dbId === ticketId);
      if (ticket && ticket !== this.ticketSeleccionado) {
        this.ticketSeleccionado = ticket;
        if (this.activeTab === section) void this.cargarMensajesChat();
      }
    }

    if (this.activeTab !== section) this.seleccionarPestana(section);

    const canonicalPath = this.rutaParaSeccion(section);
    if (canonicalPath && this.router.url !== canonicalPath)
      void this.router.navigateByUrl(canonicalPath, { replaceUrl: true });
  }

  private rutaParaSeccion(section: string): string | undefined {
    const basePath = sectionRoutePaths[section];
    if (!basePath) return undefined;
    if (section === 'Detalle de ticket' && this.ticketSeleccionado)
      return `${basePath}/${encodeURIComponent(this.ticketSeleccionado.dbId)}`;
    return basePath;
  }

  @HostListener('window:keydown', ['$event'])
  manejarAtajo(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.mostrarPaletaComandos = !this.mostrarPaletaComandos;
      this.busquedaComandos = '';
      this.changeDetector.markForCheck();
      return;
    }
    if (event.key === 'Escape' && this.mostrarPaletaComandos) {
      this.mostrarPaletaComandos = false;
      this.changeDetector.markForCheck();
      return;
    }
    if (event.altKey && /^[1-9]$/.test(event.key)) {
      const section = this.seccionesVisibles()[Number(event.key) - 1];
      if (section) {
        event.preventDefault();
        this.cambiarPestana(section.nombre);
      }
    }
  }

  comandosFiltrados(): typeof this.secciones {
    const query = this.busquedaComandos.trim().toLocaleLowerCase();
    return this.seccionesVisibles().filter(
      (section) => !query || section.nombre.toLocaleLowerCase().includes(query),
    );
  }

  ejecutarComando(nombre: string): void {
    this.cambiarPestana(nombre);
    this.mostrarPaletaComandos = false;
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
    this.cambiarPestana('Crear ticket');
  }

  private prepararFormulario(): void {
    this.nuevoTicket = this.formularioVacio();
    this.nuevoTicket.solicitante = this.perfil.nombre;
    this.nuevoTicket.email = this.perfil.email;
    if (this.organizaciones.length === 1) {
      this.nuevoTicket.organizacionId = this.organizaciones[0].id;
      this.nuevoTicket.organizacion = this.organizaciones[0].name;
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.cambiarPestana('Bandeja de tickets');
  }

  async crearTicket(): Promise<void> {
    if (
      !this.nuevoTicket.titulo.trim() ||
      !this.nuevoTicket.descripcion.trim() ||
      !this.nuevoTicket.telefono.trim() ||
      !this.nuevoTicket.organizacionId
    ) {
      this.mostrarMensaje(
        !this.nuevoTicket.organizacionId
          ? 'Selecciona una organización para el reporte'
          : 'Completa los campos obligatorios, incluido el teléfono',
        'error',
      );
      return;
    }

    try {
      const created = await this.api<ApiTicket>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: this.nuevoTicket.organizacionId,
          subject: this.nuevoTicket.titulo,
          description: this.nuevoTicket.descripcion,
          category: this.nuevoTicket.categoria,
          priority: this.nuevoTicket.prioridad,
          channel: this.nuevoTicket.canal,
          phone: this.nuevoTicket.telefono.trim(),
        }),
      });
      const ticketCreado = this.convertirTicket(created);
      this.tickets.unshift(ticketCreado);
      this.ticketSeleccionado = ticketCreado;
      this.nuevoTicket = this.formularioVacio();
      this.mostrarFormulario = false;
      this.cambiarPestana('Detalle de ticket');
      this.paginaActual = 1;
      this.mostrarMensaje(`Reporte ${ticketCreado.id} guardado correctamente`);
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo guardar el reporte.'), 'error');
    }
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
    this.cambiarPestana('Detalle de ticket');
  }

  async cargarMensajesChat(showLoading = true): Promise<void> {
    const ticketId = this.ticketSeleccionado?.dbId;
    if (!ticketId || !this.usuarioActual) {
      this.chatLoadVersion++;
      this.chatTicketIdLoaded = null;
      this.mensajesChat = [];
      return;
    }

    if (this.chatTicketIdLoaded !== ticketId) {
      this.chatTicketIdLoaded = ticketId;
      this.mensajesChat = [];
      this.nuevoMensajeChat = '';
      this.errorChat = '';
    }

    const loadVersion = ++this.chatLoadVersion;
    if (showLoading) this.cargandoChat = true;
    if (showLoading || this.mensajesChat.length === 0) this.errorChat = '';
    try {
      const messages = await this.api<TicketChatMessage[]>(`/tickets/${ticketId}/messages`);
      if (loadVersion !== this.chatLoadVersion || this.ticketSeleccionado?.dbId !== ticketId)
        return;
      this.mensajesChat = messages;
      this.errorChat = '';
    } catch (error) {
      if (loadVersion !== this.chatLoadVersion || this.ticketSeleccionado?.dbId !== ticketId)
        return;
      if (showLoading || this.mensajesChat.length === 0)
        this.errorChat = this.mensajeError(error, 'No se pudo cargar la conversación.');
    } finally {
      if (loadVersion === this.chatLoadVersion) {
        this.cargandoChat = false;
        this.changeDetector.markForCheck();
      }
    }
  }

  async enviarMensajeChat(): Promise<void> {
    const ticketId = this.ticketSeleccionado?.dbId;
    const message = this.nuevoMensajeChat.trim();
    if (!ticketId || !message || this.enviandoChat) return;
    if (message.length > 4000) {
      this.errorChat = 'El mensaje no puede superar los 4000 caracteres.';
      return;
    }

    this.enviandoChat = true;
    this.errorChat = '';
    try {
      const created = await this.api<TicketChatMessage>(`/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      if (this.ticketSeleccionado?.dbId === ticketId) {
        this.nuevoMensajeChat = '';
        this.mensajesChat = [...this.mensajesChat, created];
        await this.cargarMensajesChat(false);
      }
    } catch (error) {
      if (this.ticketSeleccionado?.dbId === ticketId)
        this.errorChat = this.mensajeError(error, 'No se pudo enviar el mensaje.');
    } finally {
      this.enviandoChat = false;
      this.changeDetector.markForCheck();
    }
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
  }

  async guardarCambiosDetalle(): Promise<void> {
    if (!this.ticketSeleccionado || !this.esAdmin()) return;
    if (await this.guardarTicketEnApi(this.ticketSeleccionado)) {
      this.mostrarMensaje('Cambios del ticket guardados correctamente');
      this.mostrarDetalle = false;
    }
  }

  resolverTicket(ticket: Ticket): void {
    if (!this.puedeAtender() || (this.esAgente() && ticket.agenteId !== this.usuarioActual?.id))
      return;
    this.ticketResolucion = ticket;
    this.notasResolucion = '';
    this.mostrarResolucion = true;
  }

  async confirmarResolucion(): Promise<void> {
    const ticket = this.ticketResolucion;
    const notes = this.notasResolucion.trim();
    if (!ticket || notes.length < 10) {
      this.mostrarMensaje('Explica cómo se resolvió el ticket (mínimo 10 caracteres).', 'error');
      return;
    }
    try {
      const updated = await this.api<ApiTicket>(`/tickets/${ticket.dbId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutionNotes: notes }),
      });
      const saved = this.convertirTicket(updated);
      const index = this.tickets.findIndex((item) => item.dbId === saved.dbId);
      if (index >= 0) this.tickets[index] = saved;
      if (this.ticketSeleccionado?.dbId === saved.dbId) this.ticketSeleccionado = saved;
      await this.cargarArticulosKB();
      this.mostrarResolucion = false;
      this.ticketResolucion = null;
      this.mostrarMensaje(
        `Ticket ${saved.id} resuelto. La solución se guardó en la base de conocimiento para revisión.`,
      );
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo resolver el ticket.'), 'error');
    }
  }

  async reabrirTicket(ticket: Ticket): Promise<void> {
    ticket.estado = 'Abierto';
    if (await this.guardarTicketEnApi(ticket))
      this.mostrarMensaje(`${ticket.id} reabierto correctamente`);
  }

  abrirAsignacion(ticket: Ticket): void {
    if (!this.esAdmin()) return;
    this.ticketSeleccionado = ticket;
    this.agenteSeleccionado = ticket.agenteId ?? '';
    this.mostrarAsignacion = true;
    this.mostrarDetalle = false;
  }

  async asignarAgente(): Promise<void> {
    if (!this.ticketSeleccionado || !this.esAdmin()) return;
    const agente = this.agentes.find((item) => item.id === this.agenteSeleccionado);
    this.ticketSeleccionado.agenteId = agente?.id ?? null;
    this.ticketSeleccionado.agente = agente?.name ?? 'Sin asignar';
    if (await this.guardarTicketEnApi(this.ticketSeleccionado)) {
      this.mostrarAsignacion = false;
      this.mostrarMensaje(
        agente
          ? `Ticket ${this.ticketSeleccionado.id} asignado a ${agente.name}`
          : `Se quitó la asignación de ${this.ticketSeleccionado.id}`,
      );
    }
  }

  private async guardarTicketEnApi(ticket: Ticket): Promise<boolean> {
    if (!ticket.dbId || !this.esAdmin()) return false;
    try {
      const updated = await this.api<ApiTicket>(`/tickets/${ticket.dbId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: ticket.estado,
          priority: ticket.prioridad,
          queue: ticket.cola,
          assigneeId: ticket.agenteId,
        }),
      });
      const saved = this.convertirTicket(updated);
      const index = this.tickets.findIndex((item) => item.dbId === ticket.dbId);
      if (index >= 0) this.tickets[index] = saved;
      if (this.ticketSeleccionado?.dbId === saved.dbId) this.ticketSeleccionado = saved;
      return true;
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo guardar el ticket.'), 'error');
      await this.recargarTickets();
      return false;
    }
  }

  async cambiarRolUsuario(user: ManagedUser, role: 'User' | 'Agent'): Promise<void> {
    if (!this.esAdmin() || user.role === role) return;
    try {
      const updated = await this.api<ManagedUser>(`/users/${user.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      this.usuariosAdministrables = this.usuariosAdministrables.map((item) =>
        item.id === updated.id ? updated : item,
      );
      this.agentes = await this.api<Agent[]>('/agents');
      this.mostrarMensaje(
        role === 'Agent'
          ? `${user.name} ya puede atender tickets asignados.`
          : `Se retiró el permiso de agente a ${user.name}.`,
      );
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo actualizar el permiso.'), 'error');
    }
  }

  async eliminarUsuario(user: ManagedUser): Promise<void> {
    if (!this.esAdmin()) return;
    const confirmed = window.confirm(
      `¿Eliminar la cuenta de ${user.name} (${user.email})? Sus tickets se conservarán en el historial y sus asignaciones activas quedarán libres.`,
    );
    if (!confirmed) return;
    try {
      await this.api<void>(`/users/${user.id}`, { method: 'DELETE' });
      this.usuariosAdministrables = this.usuariosAdministrables.filter(
        (item) => item.id !== user.id,
      );
      try {
        this.agentes = await this.api<Agent[]>('/agents');
        await this.recargarTickets();
      } catch {
        // La cuenta ya fue eliminada; una actualización de la vista puede reintentarse al recargar.
      }
      this.mostrarMensaje(`La cuenta de ${user.name} fue eliminada.`);
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo eliminar la cuenta.'), 'error');
    }
  }

  async guardarClasificacion(ticket: Ticket): Promise<void> {
    if (!this.puedeAtender()) return;
    const category = this.categoriaEdicion[ticket.dbId] ?? ticket.categoria;
    try {
      await this.api(`/tickets/${ticket.dbId}/classification`, {
        method: 'POST',
        body: JSON.stringify({ category }),
      });
      ticket.categoria = category;
      this.mostrarMensaje(`Clasificación de ${ticket.id} guardada.`);
    } catch (error) {
      this.mostrarMensaje(
        this.mensajeError(error, 'No se pudo guardar la clasificación.'),
        'error',
      );
    }
  }

  async cargarLlamadas(): Promise<void> {
    try {
      this.llamadas = await this.api<CallSession[]>('/calls');
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudieron cargar las llamadas.'), 'error');
    }
  }

  async cargarTransferencias(): Promise<void> {
    try {
      this.transferencias = await this.api<WarmHandoff[]>('/handoffs');
    } catch (error) {
      this.mostrarMensaje(
        this.mensajeError(error, 'No se pudieron cargar las transferencias.'),
        'error',
      );
    }
  }

  async solicitarTransferencia(): Promise<void> {
    const data = this.transferenciaNueva;
    if (!data.ticketId || data.reason.trim().length < 3 || !this.puedeAtender()) {
      this.mostrarMensaje('Selecciona un ticket e indica el motivo de la transferencia.', 'error');
      return;
    }
    try {
      await this.api('/handoffs', {
        method: 'POST',
        body: JSON.stringify({
          ticketId: data.ticketId,
          provider: 'manual',
          queueRef: data.queueRef,
          extensionRef: data.extensionRef,
          reason: data.reason,
        }),
      });
      this.transferenciaNueva = { ticketId: '', queueRef: 'Soporte', extensionRef: '', reason: '' };
      await this.cargarTransferencias();
      this.mostrarMensaje('Transferencia cálida solicitada. Aparece en la bandeja entrante.');
    } catch (error) {
      this.mostrarMensaje(
        this.mensajeError(error, 'No se pudo solicitar la transferencia.'),
        'error',
      );
    }
  }

  async actualizarTransferencia(
    item: WarmHandoff,
    status: 'accepted' | 'rejected' | 'completed',
  ): Promise<void> {
    try {
      await this.api(`/handoffs/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          comment: status === 'rejected' ? 'Rechazada desde la bandeja' : null,
        }),
      });
      await this.cargarTransferencias();
      this.mostrarMensaje(
        status === 'accepted'
          ? 'Transferencia aceptada.'
          : status === 'completed'
            ? 'Transferencia completada.'
            : 'Transferencia rechazada.',
      );
    } catch (error) {
      this.mostrarMensaje(
        this.mensajeError(error, 'No se pudo actualizar la transferencia.'),
        'error',
      );
    }
  }

  async cargarArticulosKB(): Promise<void> {
    try {
      this.articulosKB = await this.api<KnowledgeArticle[]>('/knowledge/articles');
    } catch (error) {
      this.mostrarMensaje(
        this.mensajeError(error, 'No se pudieron cargar los artículos.'),
        'error',
      );
    }
  }

  async crearArticuloKB(): Promise<void> {
    const draft = this.articuloNuevo;
    if (draft.title.trim().length < 3 || draft.content.trim().length < 20) {
      this.mostrarMensaje('Escribe un título y un contenido de al menos 20 caracteres.', 'error');
      return;
    }
    try {
      await this.api('/knowledge/articles', { method: 'POST', body: JSON.stringify(draft) });
      this.articuloNuevo = {
        title: '',
        content: '',
        productCode: '',
        moduleCode: '',
        language: 'es',
        audience: 'support',
      };
      await this.cargarArticulosKB();
      this.cambiarPestana('Base de conocimiento');
      this.mostrarMensaje('Artículo guardado y enviado a revisión.');
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo crear el artículo.'), 'error');
    }
  }

  async revisarArticuloKB(article: KnowledgeArticle, approve: boolean): Promise<void> {
    if (!this.esAdmin()) return;
    const action = approve ? 'approve' : 'reject';
    const comment = this.comentarioRechazo[article.id] ?? '';
    try {
      await this.api(`/knowledge/articles/${article.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      });
      await this.cargarArticulosKB();
      this.mostrarMensaje(
        approve
          ? `Artículo “${article.title}” aprobado y publicado.`
          : `Artículo “${article.title}” rechazado.`,
      );
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo revisar el artículo.'), 'error');
    }
  }

  private async recargarTickets(): Promise<void> {
    try {
      const tickets = await this.api<ApiTicket[]>('/tickets');
      this.tickets = tickets.map((ticket) => this.convertirTicket(ticket));
      if (this.ticketSeleccionado) {
        this.ticketSeleccionado =
          this.tickets.find((ticket) => ticket.dbId === this.ticketSeleccionado?.dbId) ?? null;
      }
      this.actualizarSlaRestante();
    } catch {
      // Se conserva la información en pantalla si el servidor no está disponible.
    }
  }

  ticketsSinAsignar(): Ticket[] {
    if (!this.esAdmin()) return [];
    return this.tickets.filter(
      (ticket) => ticket.agente === 'Sin asignar' && ticket.estado !== 'Resuelto',
    );
  }

  ticketsActivos(): Ticket[] {
    return this.tickets.filter((ticket) => ticket.estado !== 'Resuelto');
  }

  ticketsResueltos(): Ticket[] {
    return this.tickets.filter((ticket) => ticket.estado === 'Resuelto');
  }

  articulosKBFiltrados(): KnowledgeArticle[] {
    const query = this.buscarKB.trim().toLocaleLowerCase();
    return this.articulosKB.filter(
      (article) =>
        !query ||
        [
          article.title,
          article.content,
          article.productCode,
          article.moduleCode,
          article.workflowState,
        ].some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }

  ticketsAsignadosActivos(): Ticket[] {
    return this.tickets.filter(
      (ticket) =>
        ticket.estado !== 'Resuelto' &&
        (this.esAdmin() || ticket.agenteId === this.usuarioActual?.id),
    );
  }

  trackTicketById(_index: number, ticket: Ticket): string {
    return ticket.dbId || ticket.id;
  }

  ticketsTransferibles(): Ticket[] {
    return this.tickets.filter(
      (ticket) =>
        ticket.estado !== 'Resuelto' &&
        (this.esAdmin() || ticket.agenteId === this.usuarioActual?.id),
    );
  }

  articulosPendientes(): KnowledgeArticle[] {
    return this.articulosKB.filter((article) => article.workflowState === 'pending_review');
  }

  estadoArticulo(label: string): string {
    return (
      (
        {
          pending_review: 'Pendiente de revisión',
          published: 'Publicado',
          rejected: 'Rechazado',
          draft: 'Borrador',
        } as Record<string, string>
      )[label] ?? label
    );
  }

  formatearDuracion(segundos: number): string {
    const minutes = Math.floor(segundos / 60);
    const seconds = segundos % 60;
    return `${minutes} min ${seconds} s`;
  }

  ticketsVencidos(): Ticket[] {
    return this.tickets.filter((ticket) => ticket.estado !== 'Resuelto' && ticket.slaRestante <= 0);
  }

  ticketsPorPrioridad(prioridad: Prioridad): Ticket[] {
    return this.tickets.filter(
      (ticket) => ticket.prioridad === prioridad && ticket.estado !== 'Resuelto',
    );
  }

  ticketsPorCola(cola: string): Ticket[] {
    return this.tickets.filter((ticket) => ticket.cola === cola && ticket.estado !== 'Resuelto');
  }

  ticketsPorEstado(estado: Estado): Ticket[] {
    return this.tickets.filter((ticket) => ticket.estado === estado);
  }

  ticketsDeAtencion(): Ticket[] {
    return this.tickets
      .filter(
        (ticket) =>
          ticket.estado !== 'Resuelto' && (ticket.prioridad === 'P1' || ticket.slaRestante <= 2),
      )
      .sort((a, b) => a.slaRestante - b.slaRestante);
  }

  ticketsSlaFiltrados(): Ticket[] {
    return this.tickets
      .filter((ticket) => {
        return (
          ticket.estado !== 'Resuelto' &&
          (!this.filtroPrioridad || ticket.prioridad === this.filtroPrioridad)
        );
      })
      .sort((a, b) => a.slaRestante - b.slaRestante);
  }

  cantidadPorAgente(agente: string): number {
    return this.tickets.filter((ticket) => ticket.agente === agente && ticket.estado !== 'Resuelto')
      .length;
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
    return calcularPorcentajeSla(ticket);
  }

  claseSla(ticket: Ticket): string {
    return calcularClaseSla(ticket);
  }

  textoSla(ticket: Ticket): string {
    return construirTextoSla(ticket);
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
    return formatearFechaUI(fecha);
  }

  async guardarPerfil(): Promise<void> {
    if (!this.perfil.nombre.trim() || !this.perfil.email.trim()) {
      this.mostrarMensaje('El nombre y el correo son obligatorios', 'error');
      return;
    }

    try {
      const user = await this.api<SessionUser>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: this.perfil.nombre, email: this.perfil.email }),
      });
      this.usuarioActual = user;
      this.perfil.nombre = user.name;
      this.perfil.email = user.email;
      this.mostrarMensaje('Perfil actualizado correctamente');
    } catch (error) {
      this.mostrarMensaje(this.mensajeError(error, 'No se pudo guardar el perfil.'), 'error');
    }
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
  }

  cerrarMensaje(): void {
    this.mensaje = '';
  }

  exportarCSV(tickets: Ticket[]): void {
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
      'SLA restante',
    ];

    const filas = tickets.map((ticket) => [
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
      `${ticket.slaRestante} horas`,
    ]);

    const escaparCSV = (valor: string | number): string => {
      return `"${String(valor).replace(/"/g, '""')}"`;
    };

    const contenido = [
      encabezados.map(escaparCSV).join(','),
      ...filas.map((fila) => fila.map(escaparCSV).join(',')),
    ].join('\r\n');

    const archivo = new Blob(['\uFEFF', contenido], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'sildra-tickets.csv';
    enlace.click();

    URL.revokeObjectURL(url);

    this.mostrarMensaje('Archivo CSV exportado correctamente');
  }
}
