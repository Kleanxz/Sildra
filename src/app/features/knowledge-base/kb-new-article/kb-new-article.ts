
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  selector: 'app-kb-new-article',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kb-new-article.html'
})
export class KbNewArticle {
  titulo = '';
  categoria = 'Soporte técnico';
  resumen = '';
  contenido = '';
  autor = 'Agente';
  mensaje = '';
  error = '';

  categorias = [
    'Telefonía',
    'Internet',
    'Facturación',
    'Soporte técnico'
  ];

  constructor(private router: Router) {}

  guardarArticulo(): void {
    this.mensaje = '';
    this.error = '';

    if (
      !this.titulo.trim() ||
      !this.resumen.trim() ||
      !this.contenido.trim()
    ) {
      this.error = 'Completa el título, el resumen y el contenido.';
      return;
    }

    const clave = 'sildra_kb_articulos';
    let articulos: ArticuloKB[] = [];

    try {
      const guardados = localStorage.getItem(clave);
      articulos = guardados ? JSON.parse(guardados) : [];

      if (!Array.isArray(articulos)) {
        this.error = 'Los datos guardados no tienen un formato válido.';
        return;
      }
    } catch {
      this.error = 'No se pudieron leer los artículos guardados.';
      return;
    }

    const nuevoArticulo: ArticuloKB = {
      id: articulos.length
        ? Math.max(...articulos.map(a => Number(a.id) || 0)) + 1
        : 1,
      titulo: this.titulo.trim(),
      categoria: this.categoria,
      autor: this.autor,
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'Pendiente',
      resumen: this.resumen.trim(),
      contenido: this.contenido.trim()
    };

    try {
      articulos.push(nuevoArticulo);

      localStorage.setItem(
        clave,
        JSON.stringify(articulos)
      );

      this.mensaje = 'Artículo guardado y enviado a revisión.';

      this.titulo = '';
      this.categoria = 'Soporte técnico';
      this.resumen = '';
      this.contenido = '';
    } catch {
      this.error = 'No se pudo guardar el artículo en este navegador.';
    }
  }

  volverAArticulos(): void {
    this.router.navigate(['/conocimiento/articulos']);
  }
}
