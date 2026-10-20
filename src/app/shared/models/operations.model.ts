export interface CallSession {
  id: string;
  state: string;
  startedAt: string;
  connectedAt: string | null;
  endedAt: string | null;
  durationSec: number;
  channelId: string;
  bridge: string;
  providerRef: string;
  codec: string;
  channel: string;
  requesterRef: string;
}

export interface WarmHandoff {
  id: string;
  ticketId: string;
  ticketNumber: string;
  subject: string;
  provider: string;
  queueRef: string;
  extensionRef: string;
  status: string;
  reason: string;
  requestedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  failureReason: string;
}
