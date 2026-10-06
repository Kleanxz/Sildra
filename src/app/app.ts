import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  solicitante: string;
  prioridad: string;
  estado: string;
  agente: string;
  fecha: string;
}

@Component({

  selector: 'app-root',

  imports: [FormsModule],

  templateUrl: './app.html',

  styleUrl: './app.css'

})


export class App {

  mostrarFormulario = false;

  nuevoTicket = {
    titulo: '',
    descripcion: '',
    solicitante: '',
    prioridad: 'Media'
  };

  tickets: Ticket[] = [
    {
      id: '#TK-001',
      titulo: 'No puedo acceder al sistema',
      descripcion: 'Problema con las credenciales de acceso',
      solicitante: 'Juan Pérez',
      prioridad: 'Alta',
      estado: 'Abierto',
      agente: 'María',
      fecha: '06/10/2026'
    },
    {
      id: '#TK-002',
      titulo: 'Error al generar reporte',
      descripcion: 'El reporte muestra información incorrecta',
      solicitante: 'Ana Rodríguez',
      prioridad: 'Media',
      estado: 'En progreso',
      agente: 'Carlos',
      fecha: '05/10/2026'
    },
    {
      id: '#TK-003',
      titulo: 'Solicitud de acceso',
      descripcion: 'Necesito acceso al módulo de ventas',
      solicitante: 'Pedro Gómez',
      prioridad: 'Baja',
      estado: 'Resuelto',
      agente: 'María',
      fecha: '04/10/2026'
    }
  ];

  abrirFormulario() {
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
  }

  crearTicket() {

    if (
      !this.nuevoTicket.titulo.trim() ||
      !this.nuevoTicket.descripcion.trim() ||
      !this.nuevoTicket.solicitante.trim()
    ) {
      alert('Completa todos los campos');
      return;
    }

    const nuevo: Ticket = {
      id: '#TK-' + String(this.tickets.length + 1).padStart(3, '0'),
      titulo: this.nuevoTicket.titulo,
      descripcion: this.nuevoTicket.descripcion,
      solicitante: this.nuevoTicket.solicitante,
      prioridad: this.nuevoTicket.prioridad,
      estado: 'Abierto',
      agente: 'Sin asignar',
      fecha: new Date().toLocaleDateString('es-DO')
    };

    this.tickets.unshift(nuevo);

    this.nuevoTicket = {
      titulo: '',
      descripcion: '',
      solicitante: '',
      prioridad: 'Media'
    };

    this.mostrarFormulario = false;
  }
}