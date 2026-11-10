import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { RemoteTrack, Room as LiveKitRoom } from 'livekit-client';

import { ApiService } from '../../../../core/http/api.service';

interface VoiceConnectionDetails {
  serverUrl: string;
  participantToken: string;
}

type VoiceState = 'idle' | 'connecting' | 'connected' | 'disconnecting';

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      @if (abierto) {
        <div
          class="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          aria-label="Asistente de voz de SildraSupport"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-amber-700">SildraSupport</p>
              <h2 class="mt-1 text-lg font-bold text-slate-900">Asistente de voz</h2>
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

          <p class="mt-3 text-sm text-slate-600">{{ textoEstado() }}</p>

          @if (error) {
            <p
              role="alert"
              class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {{ error }}
            </p>
          }

          <div class="mt-5 flex gap-3">
            @if (estado === 'connected') {
              <button
                type="button"
                (click)="desconectar()"
                class="min-h-11 flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Terminar llamada
              </button>
            } @else {
              <button
                type="button"
                (click)="conectar()"
                [disabled]="estado !== 'idle'"
                class="min-h-11 flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
              >
                {{ estado === 'connecting' ? 'Conectando…' : 'Iniciar conversación' }}
              </button>
            }
          </div>
          <div #audioContainer class="sr-only" aria-live="off"></div>
        </div>
      }

      <button
        type="button"
        (click)="abierto = !abierto"
        [attr.aria-expanded]="abierto"
        aria-label="Abrir asistente de voz"
        class="flex min-h-12 items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
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
        {{ estado === 'connected' ? 'En llamada' : 'Hablar con soporte' }}
      </button>
    </section>
  `,
})
export class VoiceAssistantComponent implements OnDestroy {
  @ViewChild('audioContainer') private audioContainer?: ElementRef<HTMLDivElement>;

  abierto = false;
  estado: VoiceState = 'idle';
  error = '';

  private room?: LiveKitRoom;

  constructor(
    private readonly api: ApiService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  async conectar(): Promise<void> {
    if (this.estado !== 'idle') return;

    this.error = '';
    this.estado = 'connecting';
    this.changeDetector.markForCheck();
    let paso: 'token' | 'conexion' | 'microfono' = 'token';
    try {
      const details = await firstValueFrom(
        this.api.request<VoiceConnectionDetails>('/voice/token', { method: 'POST' }),
      );
      const { Room, RoomEvent } = await import('livekit-client');
      const room = new Room();
      this.room = room;
      room.on(RoomEvent.TrackSubscribed, (track) => this.adjuntarAudio(track));
      room.on(RoomEvent.TrackUnsubscribed, (track) => this.separarAudio(track));
      room.on(RoomEvent.Disconnected, () => {
        this.limpiarAudio();
        this.room = undefined;
        this.estado = 'idle';
        this.changeDetector.markForCheck();
      });

      paso = 'conexion';
      await room.connect(details.serverUrl, details.participantToken);
      paso = 'microfono';
      await room.localParticipant.setMicrophoneEnabled(true);
      this.estado = 'connected';
      this.changeDetector.markForCheck();
    } catch (error) {
      await this.room?.disconnect().catch(() => undefined);
      this.limpiarAudio();
      this.room = undefined;
      this.estado = 'idle';
      this.error = this.mensajeError(error, paso);
      this.changeDetector.markForCheck();
    }
  }

  async desconectar(): Promise<void> {
    if (!this.room || this.estado === 'disconnecting') return;
    this.estado = 'disconnecting';
    this.changeDetector.markForCheck();
    await this.room.disconnect();
    this.limpiarAudio();
    this.room = undefined;
    this.estado = 'idle';
    this.changeDetector.markForCheck();
  }

  cerrarPanel(): void {
    if (this.estado === 'idle') this.abierto = false;
  }

  textoEstado(): string {
    switch (this.estado) {
      case 'connecting':
        return 'Conectando con el asistente…';
      case 'connected':
        return 'Ya puedes hablar. El navegador puede pedir permiso para usar el micrófono.';
      case 'disconnecting':
        return 'Terminando la conversación…';
      default:
        return 'Inicia una conversación de voz con el asistente de soporte.';
    }
  }

  ngOnDestroy(): void {
    void this.room?.disconnect();
    this.limpiarAudio();
  }

  private adjuntarAudio(track: RemoteTrack): void {
    if (track.kind !== 'audio' || !this.audioContainer) return;
    this.audioContainer.nativeElement.appendChild(track.attach());
  }

  private separarAudio(track: RemoteTrack): void {
    track.detach().forEach((element) => element.remove());
  }

  private limpiarAudio(): void {
    this.audioContainer?.nativeElement.replaceChildren();
  }

  private mensajeError(error: unknown, paso: 'token' | 'conexion' | 'microfono'): string {
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
