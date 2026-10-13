
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  selector: 'app-kb-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kb-review.html'
})
export class KbReview {
  articulos: ArticuloKB[] = [];
  articuloSeleccionado: ArticuloKB | null = null;
  mensaje = '';
  filtro = 'Pendiente';

  constructor() {
    this.cargarArticulos();
  }

  cargarArticulos(): void {
    try {
      const datos = localStorage.getItem('sildra_kb_articulos');

      this.articulos = datos ? JSON.parse(datos) : [];
    } catch {
      this.articulos = [];
      this.mensaje = 'No se pudieron cargar los artículos guardados.';
    }
  }

  get articulosFiltrados(): ArticuloKB[] {
    if (this.filtro === 'Todos') {
      return this.articulos;
    }

    return this.articulos.filter(
      articulo => articulo.estado === this.filtro
    );
  }

  get totalPendientes(): number {
    return this.articulos.filter(
      articulo => articulo.estado === 'Pendiente'
    ).length;
  }

  get totalPublicados(): number {
    return this.articulos.filter(
      articulo => articulo.estado === 'Publicado'
    ).length;
  }

  seleccionarArticulo(articulo: ArticuloKB): void {
    this.articuloSeleccionado = articulo;
    this.mensaje = '';
  }

  cerrarDetalle(): void {
    this.articuloSeleccionado = null;
  }

  aprobarArticulo(articulo: ArticuloKB): void {
    articulo.estado = 'Publicado';

    this.guardarCambios(
      `El artículo "${articulo.titulo}" ha sido aprobado.`
    );
  }

  rechazarArticulo(articulo: ArticuloKB): void {
    articulo.estado = 'Rechazado';

    this.guardarCambios(
      `El artículo "${articulo.titulo}" ha sido rechazado.`
    );
  }

  private guardarCambios(mensaje: string): void {
    try {
      localStorage.setItem(
        'sildra_kb_articulos',
        JSON.stringify(this.articulos)
      );

      this.mensaje = mensaje;
      this.articuloSeleccionado = null;
    } catch {
      this.mensaje = 'No se pudieron guardar los cambios.';
    }
  }
}
