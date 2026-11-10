import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CopilotMockService {
  async reply(message: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 650));
    const normalized = message.trim();
    if (!normalized) throw new Error('El mensaje está vacío.');
    return 'Puedo ayudarte con “' + normalized + '”. Revisa los detalles del ticket y confirma la información antes de responder al solicitante.';
  }
}