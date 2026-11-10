export type CopilotMessageSender = 'agent' | 'copilot';

export interface CopilotMessage {
  id: string;
  text: string;
  sender: CopilotMessageSender;
  createdAt: string;
}