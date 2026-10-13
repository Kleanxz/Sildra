
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type EstadoTransferencia =
  | 'Preparando'
  | 'Consultando'
  | 'Transferida'
  | 'Cancelada';

interface Agente {
  nombre: string;
  departamento: string;
  disponible: boolean;
}

@Component({
  selector: 'app-warm-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './warm-transfer.html',
  styleUrl: './warm-transfer.css'
})
export class WarmTransfer {

  llamada = {
    id: '0192f3a1',
    cliente: 'María Rodríguez',
    telefono: '+1 (809) 555-0192',
    email: 'maria.rodriguez@example.com',
    asunto: 'Problema para iniciar sesión',
    agenteActual: 'Sebastián Ubri',
    duracion: '08:42'
  };

  agentes: Agente[] = [
    {
      nombre: 'Ana Martínez',
      departamento: 'Soporte técnico',
      disponible: true
    },
    {
      nombre: 'Carlos Pérez',
      departamento: 'Atención al cliente',
      disponible: true
    },
    {
      nombre: 'Laura Gómez',
      departamento: 'Facturación',
      disponible: false
    },
    {
      nombre: 'David Rodríguez',
      departamento: 'Soporte técnico',
      disponible: true
    }
  ];

  agenteSeleccionado = 'Ana Martínez';
  departamentoSeleccionado = 'Soporte técnico';

  resumen =
    'La cliente no puede iniciar sesión. Se verificó la cuenta y no presenta bloqueo. Necesita ayuda para recuperar el acceso.';

  estado: EstadoTransferencia = 'Preparando';
  mensaje = '';

  get agenteDestino(): Agente | undefined {
    return this.agentes.find(
      agente => agente.nombre === this.agenteSeleccionado
    );
  }

  cambiarAgente(): void {
    const agente = this.agenteDestino;

    if (agente) {
      this.departamentoSeleccionado = agente.departamento;
    } else {
      this.departamentoSeleccionado = '';
    }

    this.mensaje = '';
  }

  iniciarConsulta(): void {
    if (
      this.estado === 'Transferida' ||
      this.estado === 'Cancelada'
    ) {
      return;
    }

    if (
      !this.agenteSeleccionado ||
      !this.resumen.trim()
    ) {
      this.mensaje =
        'Selecciona un agente y escribe el resumen de la llamada.';
      return;
    }

    if (!this.agenteDestino?.disponible) {
      this.mensaje =
        'El agente seleccionado no está disponible.';
      return;
    }

    this.estado = 'Consultando';

    this.mensaje =
      `Consulta iniciada con ${this.agenteSeleccionado}. ` +
      'Puedes compartir el contexto antes de pasar la llamada.';
  }

  completarTransferencia(): void {
    if (this.estado !== 'Consultando') {
      this.mensaje =
        'Primero debes iniciar la consulta con el agente.';
      return;
    }

    this.estado = 'Transferida';

    this.mensaje =
      `Transferencia completada en esta demostración. ` +
      `${this.agenteSeleccionado} es el agente de destino registrado.`;
  }

  cancelarTransferencia(): void {
    if (this.estado === 'Transferida') {
      this.mensaje =
        'La transferencia ya fue completada.';
      return;
    }

    if (this.estado === 'Cancelada') {
      return;
    }

    this.estado = 'Cancelada';
    this.mensaje = 'La transferencia se ha cancelado.';
  }

  reiniciarTransferencia(): void {
    this.estado = 'Preparando';
    this.mensaje = '';
  }
}
