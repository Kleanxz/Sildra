
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ArticuloKB {
  id: number;
  titulo: string;
  categoria: string;
  autor: string;
  fecha: string;
  estado: string;
  resumen: string;
  contenido: string;
}

@Component({
  selector: 'app-kb-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kb-list.html',
  styleUrl: './kb-list.css'
})
export class KbList {
  busqueda = '';
  categoriaSeleccionada = 'Todas';
  articuloSeleccionado: ArticuloKB | null = null;

  categorias = [
    'Todas',
    'Telefonía',
    'Internet',
    'Facturación',
    'Soporte técnico'
  ];

  articulos: ArticuloKB[] = [
    {
      id: 1,
      titulo: 'Cómo solucionar problemas de conexión a Internet',
      categoria: 'Internet',
      autor: 'Equipo de soporte',
      fecha: '2026-10-10',
      estado: 'Publicado',
      resumen: 'Pasos básicos para recuperar la conexión a Internet.',
      contenido: 'Verifica que el router esté encendido y que los cables estén conectados correctamente. Reinicia el equipo y comprueba si otros dispositivos pueden conectarse. Si el problema continúa, registra el caso y remítelo al equipo técnico.'
    },
    {
      id: 2,
      titulo: 'Consultar el estado de una factura',
      categoria: 'Facturación',
      autor: 'Departamento de facturación',
      fecha: '2026-10-09',
      estado: 'Publicado',
      resumen: 'Procedimiento para ayudar al cliente a consultar su factura.',
      contenido: 'Confirma la identidad del cliente siguiendo el procedimiento establecido. Consulta los datos de facturación disponibles y explica el estado de la factura, la fecha de vencimiento y las opciones de pago.'
    },
    {
      id: 3,
      titulo: 'Pasos para reportar una avería telefónica',
      categoria: 'Telefonía',
      autor: 'Equipo de soporte',
      fecha: '2026-10-08',
      estado: 'Pendiente',
      resumen: 'Información necesaria para registrar una avería telefónica.',
      contenido: 'Solicita el número de contacto, una descripción del problema y el momento en que comenzó. Registra la incidencia y sigue el procedimiento interno para asignarla al área correspondiente.'
    },
    {
      id: 4,
      titulo: 'Recomendaciones para mejorar la señal Wi-Fi',
      categoria: 'Soporte técnico',
      autor: 'Equipo técnico',
      fecha: '2026-10-07',
      estado: 'Publicado',
      resumen: 'Consejos para mejorar la cobertura inalámbrica.',
      contenido: 'Coloca el router en un lugar abierto y céntrico, evita obstáculos grandes y mantén el equipo alejado de posibles fuentes de interferencia. Si la señal sigue siendo débil, solicita una revisión técnica.'
    }
  ];

  get articulosFiltrados(): ArticuloKB[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.articulos.filter(articulo => {
      const coincideTexto =
        articulo.titulo.toLowerCase().includes(texto) ||
        articulo.resumen.toLowerCase().includes(texto) ||
        articulo.categoria.toLowerCase().includes(texto);

      const coincideCategoria =
        this.categoriaSeleccionada === 'Todas' ||
        articulo.categoria === this.categoriaSeleccionada;

      return coincideTexto && coincideCategoria;
    });
  }

  get totalPublicados(): number {
    return this.articulos.filter(a => a.estado === 'Publicado').length;
  }

  get totalPendientes(): number {
    return this.articulos.filter(a => a.estado === 'Pendiente').length;
  }

  verArticulo(articulo: ArticuloKB): void {
    this.articuloSeleccionado = articulo;
  }

  cerrarDetalle(): void {
    this.articuloSeleccionado = null;
  }

  eliminarArticulo(id: number): void {
    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar este artículo?'
    );

    if (confirmar) {
      this.articulos = this.articulos.filter(a => a.id !== id);

      if (this.articuloSeleccionado?.id === id) {
        this.articuloSeleccionado = null;
      }
    }
  }
}
