import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConnectionState, Room, RoomEvent, Track, type TranscriptionSegment } from 'livekit-client';
import { ApiService } from '../../../core/http/api.service';

interface LiveKitTokenResponse {
  serverUrl: string;
  participantToken: string;
  roomName: string;
}

export interface LiveKitTranscript {
  sender: 'agent' | 'copilot';
  text: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LiveKitAgentService {
  private room: Room | null = null;
  private readonly audioElements = new Set<HTMLMediaElement>();

  constructor(private readonly api: ApiService) {}

  get isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected;
  }

  async connect(
    onTranscript: (message: LiveKitTranscript) => void,
    onDisconnected: () => void,
  ): Promise<void> {
    if (this.room) return;

    const tokenResponse = await firstValueFrom(
      this.api.request<LiveKitTokenResponse>('/livekit/token', {
        method: 'POST',
        body: {},
      }),
    );

    const room = new Room({ adaptiveStream: true, dynacast: true });
    this.room = room;

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) return;
      const audio = track.attach();
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      document.body.appendChild(audio);
      this.audioElements.add(audio);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      for (const element of track.detach()) {
        element.remove();
        this.audioElements.delete(element);
      }
    });

    room.on(RoomEvent.TranscriptionReceived, (segments: TranscriptionSegment[], participant) => {
      for (const segment of segments) {
        if (!segment.final || !segment.text.trim()) continue;
        onTranscript({
          sender: participant?.identity === room.localParticipant.identity ? 'agent' : 'copilot',
          text: segment.text.trim(),
          createdAt: new Date().toISOString(),
        });
      }
    });

    room.on(RoomEvent.Disconnected, () => {
      this.clearAudioElements();
      if (this.room === room) this.room = null;
      onDisconnected();
    });

    try {
      await room.connect(tokenResponse.serverUrl, tokenResponse.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    if (!this.room || this.room.state !== ConnectionState.Connected) return;
    await this.room.localParticipant.setMicrophoneEnabled(enabled);
  }

  async disconnect(): Promise<void> {
    const room = this.room;
    this.room = null;
    if (room) await room.disconnect();
    this.clearAudioElements();
  }

  private clearAudioElements(): void {
    for (const element of this.audioElements) element.remove();
    this.audioElements.clear();
  }
}
