# Sildra Support

Aplicación de soporte construida con Angular 22, componentes standalone y Tailwind CSS.

## Desarrollo

```bash
npm install
npm start
```

Abre `http://localhost:4200/`. Para generar la compilación de producción:

```bash
npm run build
```

## Organización de Angular

```text
src/app/
├── core/             # Acceso HTTP, layout principal y configuración de rutas
├── features/         # Pantallas y componentes agrupados por función
│   ├── administration/
│   ├── authentication/
│   ├── knowledge/
│   ├── operations/
│   ├── organizations/
│   ├── profile/
│   ├── quality/
│   ├── telephony/
│   └── tickets/
├── shared/           # Modelos y utilidades compartidas
├── app.ts             # Coordinación de sesión, navegación y estado de la aplicación
└── app.html           # Composición del layout y selección de pantallas
```

Cada pantalla vive junto a su plantilla dentro de `features/<función>/pages/`. Los elementos reutilizables de tickets están en `features/tickets/components/`. Los contratos de datos compartidos están en `shared/models/`; el acceso a la API y las rutas están en `core/`.

El cliente Angular usa la API local en el puerto `5080`. El backend .NET y los servicios de base de datos permanecen fuera de este workspace Angular.
