import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { RemoteTrack, Room as LiveKitRoom } from 'livekit-client';

import { ApiService } from '../../../../core/http/api.service';

interface VoiceConnectionDetails {
  serverUrl: string;
  participantToken: string;
}

type VoiceState = 'idle' | 'connecting' | 'connected' | 'disconnecting';
type AssistantMode = 'chat' | 'voice';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './voice-assistant.component.css',
  template: `
    @if (inmersivo) {
      <div
        class="assistant-immersive"
        [class.assistant-immersive--closing]="cerrandoInmersivo"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="modo === 'voice' ? 'Conversación de voz con SildraSupport' : 'Chat con SildraSupport'"
      >
        <div class="assistant-immersive__backdrop"></div>

        <main
          class="assistant-immersive__scene"
          [class.assistant-immersive__scene--chat]="modo === 'chat'"
        >
          @if (modo === 'voice') {
            <div
              class="assistant-immersive__phone"
              [class.assistant-immersive__phone--connected]="estado === 'connected'"
              [class.assistant-immersive__phone--disconnecting]="estado === 'disconnecting'"
              aria-hidden="true"
            >
              <span class="assistant-immersive__ring"></span>
              <span class="assistant-immersive__ring assistant-immersive__ring--delayed"></span>
              <span class="assistant-immersive__phone-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.07 3h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L9.05 10.9a16 16 0 0 0 4.05 4.05l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
            </div>
          } @else {
            <div
              class="assistant-immersive__chat-icon"
              [class.assistant-immersive__chat-icon--connected]="estado === 'connected'"
              [class.assistant-immersive__chat-icon--disconnecting]="estado === 'disconnecting'"
              aria-hidden="true"
            >
              <span class="assistant-immersive__chat-ring"></span>
              <span class="assistant-immersive__chat-bubble">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
                  <path d="M8 12h.01M12 12h.01M16 12h.01" />
                </svg>
              </span>
            </div>
          }

          <div class="assistant-immersive__copy" role="status" aria-live="polite">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">SildraSupport</p>
            <h2 class="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {{ modo === 'voice' ? 'Asistente de soporte' : 'Chat con el asistente' }}
            </h2>
            <p class="mt-3 max-w-sm text-center text-sm leading-6 text-slate-300">
              {{ modo === 'chat' && estado === 'connected' && mensajes.length === 0 ? 'Cuéntame en qué puedo ayudarte.' : textoEstado() }}
            </p>
          </div>

          @if (modo === 'chat' && estado === 'connected') {
            <div
              #immersiveChatScroll
              class="assistant-immersive__chat"
              aria-label="Mensajes del chat"
              aria-live="polite"
            >
              @if (mensajes.length === 0) {
                <p class="assistant-immersive__welcome">
                  Escribe tu consulta y te ayudaré a encontrar una solución.
                </p>
              }
              @for (mensaje of mensajes; track mensaje.id) {
                <div
                  class="assistant-immersive__message"
                  [class.assistant-immersive__message--user]="mensaje.sender === 'user'"
                >
                  {{ mensaje.text }}
                </div>
              }
              @if (esperandoRespuesta) {
                <div class="assistant-immersive__typing" role="status" aria-label="El asistente está escribiendo">
                  <span></span><span></span><span></span>
                </div>
              }
              @if (error) {
                <p class="assistant-immersive__error" role="alert">{{ error }}</p>
              }
            </div>
          }

          @if (modo === 'voice' && estado === 'connected') {
            <div class="assistant-immersive__wave" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span>
            </div>
          } @else if (estado === 'connecting') {
            <div class="assistant-immersive__loading" role="status" aria-label="Conectando con el asistente">
              <span></span><span></span><span></span>
            </div>
          }
        </main>

        <div
          class="assistant-immersive__controls"
          [class.assistant-immersive__controls--chat]="modo === 'chat' && estado === 'connected'"
        >
          @if ((estado === 'connected' || estado === 'disconnecting') && modo === 'voice') {
            <button
              type="button"
              (click)="desconectar()"
              [disabled]="estado === 'disconnecting'"
              class="assistant-immersive__hangup"
              aria-label="Terminar conversación"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4.5 15.5a12 12 0 0 1 15 0l1.3 1a1.5 1.5 0 0 1 .3 2.1l-1.3 1.7a1.5 1.5 0 0 1-1.9.4l-3-1.5a1.5 1.5 0 0 1-.8-1.4l.1-1.1a12 12 0 0 0-4.4 0l.1 1.1a1.5 1.5 0 0 1-.8 1.4l-3 1.5a1.5 1.5 0 0 1-1.9-.4l-1.3-1.7a1.5 1.5 0 0 1 .3-2.1l1.3-1z" />
              </svg>
            </button>
            <span class="text-sm text-slate-400">Terminar conversación</span>
          } @else if (estado === 'connected' && modo === 'chat') {
            <form class="assistant-immersive__composer" (ngSubmit)="enviarMensaje()">
              <input
                type="text"
                name="mensajeChatImmersive"
                [(ngModel)]="borrador"
                [disabled]="enviando || estado !== 'connected'"
                maxlength="1000"
                autocomplete="off"
                placeholder="Escribe un mensaje…"
                aria-label="Escribe tu mensaje"
              />
              <button type="submit" [disabled]="!borrador.trim() || enviando" aria-label="Enviar mensaje">
                Enviar
              </button>
            </form>
            <button type="button" class="assistant-immersive__end-chat" (click)="desconectar()">
              Terminar chat
            </button>
          } @else if (estado === 'disconnecting' && modo === 'chat') {
            <span class="text-sm text-slate-400">Terminando chat…</span>
          } @else {
            <button
              type="button"
              (click)="cancelarConexion()"
              class="assistant-immersive__cancel"
            >
              Cancelar
            </button>
          }
        </div>
      </div>
    }

    <section
      class="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3"
      [class.assistant-widget--hidden]="inmersivo"
      [attr.aria-hidden]="inmersivo ? 'true' : null"
    >
      @if (abierto) {
        <div
          class="assistant-panel w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          aria-label="Asistente de soporte de SildraSupport"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-amber-700">SildraSupport</p>
              <h2 class="mt-1 text-lg font-bold text-slate-900">Asistente de soporte</h2>
            </div>
            <button
              type="button"
              (click)="cerrarPanel()"
              aria-label="Cerrar asistente de voz"
              class="grid h-8 w-8 place-items-center rounded-lg text-lg text-slate-500 hover:bg-slate-100"
            >
              ×
            </button>
          </div>

          <div class="mt-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1" aria-label="Modo de conversación">
            <button
              type="button"
              (click)="seleccionarModo('chat')"
              [disabled]="estado !== 'idle'"
              [attr.aria-pressed]="modo === 'chat'"
              class="rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              [class.bg-white]="modo === 'chat'"
              [class.text-slate-900]="modo === 'chat'"
              [class.shadow-sm]="modo === 'chat'"
              [class.text-slate-500]="modo !== 'chat'"
            >
              Escribir
            </button>
            <button
              type="button"
              (click)="seleccionarModo('voice')"
              [disabled]="estado !== 'idle'"
              [attr.aria-pressed]="modo === 'voice'"
              class="rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              [class.bg-white]="modo === 'voice'"
              [class.text-slate-900]="modo === 'voice'"
              [class.shadow-sm]="modo === 'voice'"
              [class.text-slate-500]="modo !== 'voice'"
            >
              Voz
            </button>
          </div>

          @if (modo === 'voice') {
            <div
              class="assistant-voice-visual"
              [class.assistant-voice-visual--connecting]="estado === 'connecting'"
              [class.assistant-voice-visual--connected]="estado === 'connected'"
              [class.assistant-voice-visual--disconnecting]="estado === 'disconnecting'"
              aria-hidden="true"
            >
              <span class="assistant-voice-visual__ring"></span>
              <span class="assistant-voice-visual__ring assistant-voice-visual__ring--delayed"></span>
              <span class="assistant-voice-visual__orb">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
                </svg>
              </span>
            </div>
          }

          <div
            class="assistant-status mt-3 flex items-start gap-2"
            [class.assistant-status--connecting]="estado === 'connecting'"
            [class.assistant-status--connected]="estado === 'connected'"
            [class.assistant-status--disconnecting]="estado === 'disconnecting'"
            role="status"
            aria-live="polite"
          >
            <span class="assistant-status__dot" aria-hidden="true"></span>
            <p class="text-sm text-slate-600">{{ textoEstado() }}</p>
          </div>

          @if (modo === 'chat') {
            <div
              #chatScroll
              class="mt-4 flex h-64 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3"
              aria-label="Mensajes del chat"
              aria-live="polite"
            >
              @if (mensajes.length === 0) {
                <p class="m-auto max-w-56 text-center text-sm text-slate-500">
                  Escribe tu consulta y el asistente te responderá aquí.
                </p>
              }
              @for (mensaje of mensajes; track mensaje.id) {
                <div
                  class="assistant-message max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  [class.self-end]="mensaje.sender === 'user'"
                  [class.bg-slate-900]="mensaje.sender === 'user'"
                  [class.text-white]="mensaje.sender === 'user'"
                  [class.self-start]="mensaje.sender === 'assistant'"
                  [class.bg-white]="mensaje.sender === 'assistant'"
                  [class.text-slate-800]="mensaje.sender === 'assistant'"
                  [class.shadow-sm]="mensaje.sender === 'assistant'"
                >
                  {{ mensaje.text }}
                </div>
              }
              @if (esperandoRespuesta) {
                <div
                  class="assistant-typing self-start rounded-2xl bg-white px-3 py-2 shadow-sm"
                  role="status"
                  aria-label="El asistente está escribiendo"
                >
                  <span class="assistant-typing__dot"></span>
                  <span class="assistant-typing__dot"></span>
                  <span class="assistant-typing__dot"></span>
                </div>
              }
            </div>

            @if (estado === 'connected') {
              <form class="mt-3 flex gap-2" (ngSubmit)="enviarMensaje()">
                <input
                  type="text"
                  name="mensajeChat"
                  [(ngModel)]="borrador"
                  [disabled]="enviando || estado !== 'connected'"
                  maxlength="1000"
                  autocomplete="off"
                  placeholder="Escribe tu mensaje…"
                  aria-label="Escribe tu mensaje"
                  class="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  [disabled]="!borrador.trim() || enviando"
                  aria-label="Enviar mensaje"
                  class="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Enviar
                </button>
              </form>
            }
          }

          @if (error) {
            <p
              role="alert"
              class="assistant-error mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {{ error }}
            </p>
          }

          <div class="mt-5 flex gap-3">
            @if (estado === 'connected' && modo === 'voice') {
              <button
                type="button"
                (click)="desconectar()"
                class="min-h-11 flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Terminar llamada
              </button>
            } @else if (estado === 'connected') {
              <button
                type="button"
                (click)="desconectar()"
                class="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Terminar chat
              </button>
            } @else {
              <button
                type="button"
                (click)="conectar()"
                [disabled]="estado !== 'idle'"
                class="min-h-11 flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
              >
                {{ estado === 'connecting' ? 'Conectando…' : (modo === 'chat' ? 'Iniciar chat' : 'Iniciar conversación') }}
              </button>
            }
          </div>
          @if (modo === 'voice') {
            <div #audioContainer class="sr-only" aria-live="off"></div>
          }
        </div>
      }

      <button
        type="button"
        (click)="abierto = !abierto"
        [attr.aria-expanded]="abierto"
        [class.assistant-launcher--attention]="estado === 'idle' && !abierto"
        [class.assistant-launcher--active]="estado === 'connected'"
        aria-label="Abrir asistente de soporte"
        class="assistant-launcher flex min-h-12 items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
        >
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.07 3h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L9.05 10.9a16 16 0 0 0 4.05 4.05l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.92z"
          />
        </svg>
        {{ estado === 'connected' ? (modo === 'chat' ? 'Chat activo' : 'En llamada') : 'Contactar soporte' }}
      </button>
    </section>
  `,
})
export class VoiceAssistantComponent implements OnDestroy {
  @ViewChild('audioContainer') private audioContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('chatScroll') private chatScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('immersiveChatScroll') private immersiveChatScroll?: ElementRef<HTMLDivElement>;

  abierto = false;
  inmersivo = false;
  cerrandoInmersivo = false;
  estado: VoiceState = 'idle';
  modo: AssistantMode = 'chat';
  error = '';
  borrador = '';
  mensajes: ChatMessage[] = [];
  enviando = false;
  esperandoRespuesta = false;

  private room?: LiveKitRoom;
  private responseTimer?: ReturnType<typeof setTimeout>;
  private voiceAttemptId = 0;

  constructor(
    private readonly api: ApiService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  async conectar(): Promise<void> {
    if (this.estado !== 'idle') return;

    const attemptId = ++this.voiceAttemptId;
    this.error = '';
    this.inmersivo = true;
    this.estado = 'connecting';
    this.esperandoRespuesta = false;
    if (this.modo === 'chat') this.mensajes = [];
    this.changeDetector.markForCheck();
    let paso: 'token' | 'conexion' | 'microfono' = 'token';
    try {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        await new Promise<void>((resolve) => setTimeout(resolve, 880));
      }
      if (attemptId !== this.voiceAttemptId) return;

      const details = await firstValueFrom(
        this.api.request<VoiceConnectionDetails>('/voice/token', { method: 'POST' }),
      );
      if (attemptId !== this.voiceAttemptId) return;

      const { Room, RoomEvent } = await import('livekit-client');
      if (attemptId !== this.voiceAttemptId) return;

      const room = new Room();
      this.room = room;
      room.on(RoomEvent.TrackSubscribed, (track) => this.adjuntarAudio(track));
      room.on(RoomEvent.TrackUnsubscribed, (track) => this.separarAudio(track));
      room.registerTextStreamHandler('lk.transcription', (reader, participantInfo) => {
        if (participantInfo.identity === room.localParticipant.identity) return;
        void this.recibirRespuesta(reader);
      });
      room.on(RoomEvent.Disconnected, () => {
        if (this.room !== room) return;
        this.voiceAttemptId++;
        this.limpiarTemporizadorRespuesta();
        this.limpiarAudio();
        this.room = undefined;
        this.esperandoRespuesta = false;
        this.estado = 'disconnecting';
        this.changeDetector.markForCheck();
        if (!this.cerrandoInmersivo) void this.finalizarDesconexionRemota();
      });

      paso = 'conexion';
      await room.connect(details.serverUrl, details.participantToken);
      if (attemptId !== this.voiceAttemptId) {
        await room.disconnect();
        return;
      }
      await this.esperarAgente(room, RoomEvent, attemptId);
      if (attemptId !== this.voiceAttemptId) return;
      if (this.modo === 'voice') {
        paso = 'microfono';
        await room.localParticipant.setMicrophoneEnabled(true);
      }
      if (attemptId !== this.voiceAttemptId) return;
      this.estado = 'connected';
      this.changeDetector.markForCheck();
    } catch (error) {
      if (attemptId !== this.voiceAttemptId) return;
      await this.room?.disconnect().catch(() => undefined);
      this.limpiarAudio();
      this.room = undefined;
      this.inmersivo = false;
      this.estado = 'idle';
      this.error = this.mensajeError(error, paso);
      this.changeDetector.markForCheck();
    }
  }

  async desconectar(): Promise<void> {
    if (!this.room || this.estado === 'disconnecting') return;
    const room = this.room;
    this.estado = 'disconnecting';
    this.limpiarTemporizadorRespuesta();
    this.changeDetector.markForCheck();
    await this.cerrarVisualInmersivo();
    await room.disconnect().catch(() => undefined);
    this.limpiarAudio();
    this.room = undefined;
    this.inmersivo = false;
    this.cerrandoInmersivo = false;
    this.estado = 'idle';
    this.esperandoRespuesta = false;
    this.changeDetector.markForCheck();
  }

  async cancelarConexion(): Promise<void> {
    if (this.estado !== 'connecting') return;

    this.voiceAttemptId++;
    const room = this.room;
    this.limpiarTemporizadorRespuesta();
    this.limpiarAudio();
    this.estado = 'disconnecting';
    this.changeDetector.markForCheck();
    await this.cerrarVisualInmersivo();
    await room?.disconnect().catch(() => undefined);
    this.room = undefined;
    this.inmersivo = false;
    this.cerrandoInmersivo = false;
    this.estado = 'idle';
    this.changeDetector.markForCheck();
  }

  seleccionarModo(modo: AssistantMode): void {
    if (this.estado !== 'idle') return;
    this.modo = modo;
    this.error = '';
    this.changeDetector.markForCheck();
  }

  async enviarMensaje(): Promise<void> {
    const text = this.borrador.trim();
    const room = this.room;
    if (!text || !room || this.estado !== 'connected' || this.enviando) return;

    this.error = '';
    this.enviando = true;
    this.mensajes = [...this.mensajes, { id: this.nuevoIdMensaje(), sender: 'user', text }];
    this.borrador = '';
    this.esperandoRespuesta = true;
    this.actualizarChat();
    this.limpiarTemporizadorRespuesta();
    this.responseTimer = setTimeout(() => {
      this.esperandoRespuesta = false;
      this.error = 'SildraBot no respondió en 30 segundos. Revisa que el agente esté activo en LiveKit e inténtalo de nuevo.';
      this.changeDetector.markForCheck();
    }, 30_000);

    try {
      await room.localParticipant.sendText(text, { topic: 'lk.chat' });
    } catch {
      this.limpiarTemporizadorRespuesta();
      this.esperandoRespuesta = false;
      this.error = 'No se pudo enviar el mensaje. Comprueba la conexión e inténtalo de nuevo.';
    } finally {
      this.enviando = false;
      this.changeDetector.markForCheck();
    }
  }

  cerrarPanel(): void {
    if (this.estado === 'idle') this.abierto = false;
  }

  textoEstado(): string {
    switch (this.estado) {
      case 'connecting':
        return 'Conectando con el asistente…';
      case 'connected':
        return this.modo === 'chat'
          ? 'SildraBot está conectado. Escribe tu consulta para comenzar.'
          : 'Ya puedes hablar. El navegador puede pedir permiso para usar el micrófono.';
      case 'disconnecting':
        return 'Terminando la conversación…';
      default:
        return this.modo === 'chat'
          ? 'Escribe al asistente de soporte, o cambia a voz si prefieres hablar.'
          : 'Inicia una conversación de voz con el asistente de soporte.';
    }
  }

  ngOnDestroy(): void {
    this.voiceAttemptId++;
    this.limpiarTemporizadorRespuesta();
    const room = this.room;
    this.room = undefined;
    void room?.disconnect();
    this.limpiarAudio();
  }

  private adjuntarAudio(track: RemoteTrack): void {
    if (this.modo !== 'voice' || track.kind !== 'audio' || !this.audioContainer) return;
    this.audioContainer.nativeElement.appendChild(track.attach());
  }

  private separarAudio(track: RemoteTrack): void {
    track.detach().forEach((element) => element.remove());
  }

  private limpiarAudio(): void {
    this.audioContainer?.nativeElement.replaceChildren();
  }

  private nuevoIdMensaje(): string {
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private actualizarChat(): void {
    this.changeDetector.markForCheck();
    setTimeout(() => {
      const element = (this.inmersivo ? this.immersiveChatScroll : this.chatScroll)?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }

  private esperarAgente(
    room: LiveKitRoom,
    roomEvent: typeof import('livekit-client').RoomEvent,
    attemptId: number,
  ): Promise<void> {
    if (room.remoteParticipants.size > 0) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        room.off(roomEvent.ParticipantConnected, onParticipantConnected);
        room.off(roomEvent.Disconnected, onDisconnected);
      };
      const onParticipantConnected = () => {
        if (room.remoteParticipants.size === 0) return;
        cleanup();
        resolve();
      };
      const onDisconnected = () => {
        cleanup();
        reject(new Error('SILDRA_CONNECT_CANCELLED'));
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('SILDRA_AGENT_JOIN_TIMEOUT'));
      }, 30_000);

      room.on(roomEvent.ParticipantConnected, onParticipantConnected);
      room.on(roomEvent.Disconnected, onDisconnected);
      if (attemptId !== this.voiceAttemptId) {
        cleanup();
        reject(new Error('SILDRA_CONNECT_CANCELLED'));
        return;
      }
      if (room.remoteParticipants.size > 0) onParticipantConnected();
    });
  }

  private async recibirRespuesta(reader: AsyncIterable<string>): Promise<void> {
    const id = this.nuevoIdMensaje();
    let text = '';

    try {
      for await (const part of reader) {
        text += part;
        if (!text.trim()) continue;
        this.limpiarTemporizadorRespuesta();
        this.esperandoRespuesta = false;
        this.error = '';
        const existingIndex = this.mensajes.findIndex((message) => message.id === id);
        const reply: ChatMessage = { id, sender: 'assistant', text };
        this.mensajes = existingIndex === -1
          ? [...this.mensajes, reply]
          : this.mensajes.map((message, index) => index === existingIndex ? reply : message);
        this.actualizarChat();
      }
    } catch {
      if (!text) {
        this.limpiarTemporizadorRespuesta();
        this.esperandoRespuesta = false;
        this.error = 'Se perdió la respuesta del asistente. Intenta enviar el mensaje otra vez.';
        this.changeDetector.markForCheck();
      }
    }
  }

  private async finalizarDesconexionRemota(): Promise<void> {
    await this.cerrarVisualInmersivo();
    this.estado = 'idle';
    this.esperandoRespuesta = false;
    this.cerrandoInmersivo = false;
    this.changeDetector.markForCheck();
  }

  private async cerrarVisualInmersivo(): Promise<void> {
    if (!this.inmersivo) return;

    this.cerrandoInmersivo = true;
    this.changeDetector.markForCheck();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await new Promise<void>((resolve) => setTimeout(resolve, 580));
    }
    this.inmersivo = false;
    this.changeDetector.markForCheck();
  }

  private limpiarTemporizadorRespuesta(): void {
    if (this.responseTimer) clearTimeout(this.responseTimer);
    this.responseTimer = undefined;
  }

  private mensajeError(error: unknown, paso: 'token' | 'conexion' | 'microfono'): string {
    if (error instanceof Error && error.message === 'SILDRA_AGENT_JOIN_TIMEOUT')
      return 'LiveKit conectó, pero SildraBot no entró a la sala. Revisa que el agente esté desplegado y activo.';

    if (
      error instanceof Error &&
      /permission|denied|notallowed/i.test(error.name + error.message)
    ) {
      return 'Permite el uso del micrófono en el navegador y vuelve a intentarlo.';
    }

    const status =
      error && typeof error === 'object' && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : undefined;

    if (paso === 'token') {
      if (status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión e inténtalo otra vez.';
      if (status === 503) return 'La API no tiene configuradas las credenciales de LiveKit.';
      if (status === 0) return 'No se pudo conectar con la API para solicitar acceso a LiveKit.';
      return error instanceof Error && error.message
        ? error.message
        : 'La API no pudo generar el acceso al asistente.';
    }

    if (paso === 'microfono')
      return 'LiveKit conectó, pero no se pudo activar el micrófono. Revisa el permiso del navegador.';

    if (
      error instanceof Error &&
      /401|unauthorized|token|forbidden/i.test(error.name + error.message)
    )
      return 'LiveKit rechazó el token. La API y el agente deben usar las credenciales del mismo proyecto.';

    if (
      error instanceof Error &&
      /url|websocket|network|connect|server/i.test(error.name + error.message)
    )
      return 'No se pudo alcanzar el servidor de LiveKit. Revisa la URL del proyecto y vuelve a intentarlo.';

    return 'No se pudo iniciar la conversación. Comprueba el micrófono y que el agente esté disponible.';
  }
}
