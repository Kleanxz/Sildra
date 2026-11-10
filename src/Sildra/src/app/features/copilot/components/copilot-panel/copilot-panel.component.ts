import { Component, OnDestroy } from '@angular/core';
import { CopilotMessage } from '../../models/copilot-message.model';
import { LiveKitAgentService } from '../../services/livekit-agent.service';
import { LiveKitTranscript } from '../../services/livekit-agent.service';

type CallState = 'disconnected' | 'connecting' | 'connected' | 'error';

@Component({
  selector: 'app-copilot-panel',
  standalone: true,
  templateUrl: './copilot-panel.component.html',
  styleUrl: './copilot-panel.component.css',
})
export class CopilotPanelComponent implements OnDestroy {
  messages: CopilotMessage[] = [];
  callState: CallState = 'disconnected';
  errorMessage = '';
  microphoneEnabled = false;

  constructor(private readonly liveKit: LiveKitAgentService) {}

  async connect(): Promise<void> {
    if (this.callState === 'connecting' || this.callState === 'connected') return;
    this.callState = 'connecting';
    this.errorMessage = '';

    try {
      await this.liveKit.connect(
        (transcript) => this.addTranscript(transcript),
        () => {
          this.microphoneEnabled = false;
          this.callState = 'disconnected';
        },
      );
      this.microphoneEnabled = true;
      this.callState = 'connected';
    } catch (error) {
      this.callState = 'error';
      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con el agente de voz.';
    }
  }

  async toggleMicrophone(): Promise<void> {
    if (this.callState !== 'connected') return;
    const nextEnabled = !this.microphoneEnabled;
    try {
      await this.liveKit.setMicrophoneEnabled(nextEnabled);
      this.microphoneEnabled = nextEnabled;
      this.errorMessage = '';
    } catch {
      this.errorMessage = 'No se pudo cambiar el estado del micrófono.';
    }
  }

  async disconnect(): Promise<void> {
    await this.liveKit.disconnect();
    this.microphoneEnabled = false;
    this.callState = 'disconnected';
  }

  ngOnDestroy(): void {
    void this.liveKit.disconnect();
  }

  private addTranscript(transcript: LiveKitTranscript): void {
    this.messages = [
      ...this.messages,
      {
        id: String(this.messages.length + 1),
        text: transcript.text,
        sender: transcript.sender,
        createdAt: transcript.createdAt,
      },
    ];
  }
}
