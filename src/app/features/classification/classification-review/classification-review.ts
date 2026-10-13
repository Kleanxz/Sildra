import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-classification-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './classification-review.html',
  styleUrl: './classification-review.css'
})
export class ClassificationReview {
  clasificaciones = [
    {
      id: 1001,
      cliente: 'María Rodríguez',
      asunto: 'Problema con el servicio de internet',
      categoria: 'Soporte técnico',
      prioridad: 'Alta',
      motivo: 'Conexión intermitente',
      estado: 'Pendiente'
    },
    {
      id: 1002,
      cliente: 'Carlos Martínez',
      asunto: 'Consulta sobre facturación',
      categoria: 'Facturación',
      prioridad: 'Media',
      motivo: 'Duda sobre el monto facturado',
      estado: 'Pendiente'
    },
    {
      id: 1003,
      cliente: 'Laura Gómez',
      asunto: 'Solicitud de cambio de plan',
      categoria: 'Gestión de cuenta',
      prioridad: 'Baja',
      motivo: 'Cambio de plan contratado',
      estado: 'Revisada'
    }
  ];

  clasificacionSeleccionada: any = null;
  busqueda = '';
  filtroEstado = 'Todos';
  mensaje = '';

  get clasificacionesFiltradas() {
    return this.clasificaciones.filter(item => {
      const texto = `${item.id} ${item.cliente} ${item.asunto} ${item.categoria}`
        .toLowerCase();

      const coincideBusqueda = texto.includes(this.busqueda.toLowerCase());
      const coincideEstado =
        this.filtroEstado === 'Todos' ||
        item.estado === this.filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }

  seleccionarClasificacion(item: any): void {
    this.clasificacionSeleccionada = { ...item };
    this.mensaje = '';
  }

  guardarRevision(): void {
    if (!this.clasificacionSeleccionada) {
      return;
    }

    const indice = this.clasificaciones.findIndex(
      item => item.id === this.clasificacionSeleccionada.id
    );

    if (indice !== -1) {
      this.clasificaciones[indice] = {
        ...this.clasificacionSeleccionada,
        estado: 'Revisada'
      };

      this.clasificaciones = [...this.clasificaciones];
      this.clasificacionSeleccionada = null;
      this.mensaje = 'La clasificación se revisó correctamente.';
    }
  }

  cancelarRevision(): void {
    this.clasificacionSeleccionada = null;
    this.mensaje = '';
  }
}