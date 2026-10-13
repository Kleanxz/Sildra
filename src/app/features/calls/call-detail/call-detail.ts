
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface NotaLlamada {
  autor: string;
  texto: string;
  hora: string;
}

@Component({
  selector: 'app-call-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './call-detail.html',
  styleUrl: './call-detail.css'
})
export class CallDetail {
  llamada = {
    id: '0192f3a1',
    cliente: 'María Rodríguez',
    telefono: '+1 (809) 555-0192',
    email: 'maria.rodriguez@example.com',
    estado: 'En llamada',
    direccion: 'Entrante',
    duracion: '08:42',
    prioridad: 'Alta',
    categoria: 'Acceso',
    asunto: 'Problema para iniciar sesión',
    agente: 'Sebastián Ubri',
    inicio: '10:24 AM'
  };

  nuevaNota = '';

  notas: NotaLlamada[] = [
    {
      autor: 'Sebastián Ubri',
      texto: 'La cliente indica que no puede acceder al sistema.',
      hora: '10:26 AM'
    },
    {
      autor: 'Sebastián Ubri',
      texto: 'Se verificó la cuenta y no presenta bloqueo.',
      hora: '10:29 AM'
    }
  ];

  get llamadaFinalizada(): boolean {
    return this.llamada.estado === 'Finalizada';
  }

  agregarNota(): void {
    const texto = this.nuevaNota.trim();

    if (!texto) {
      return;
    }

    this.notas.unshift({
      autor: this.llamada.agente,
      texto,
      hora: new Date().toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    this.nuevaNota = '';
  }

  finalizarLlamada(): void {
    if (this.llamadaFinalizada) {
      return;
    }

    this.llamada.estado = 'Finalizada';
  }
}