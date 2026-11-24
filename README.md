# Sildra Support

Aplicación de soporte con interfaz Angular standalone, API .NET 10 y PostgreSQL. La guía funcional está en [`docs/guia-tecnica-sildra-support.docx`](docs/guia-tecnica-sildra-support.docx).

## Requisitos

- .NET SDK 10
- Node.js y npm
- PostgreSQL con el esquema Sildra instalado

## Configuración

Copia `src/SildraSupport.Api/.env.example` a `src/SildraSupport.Api/.env` y completa los valores de tu entorno. No publiques `.env` ni credenciales. `appsettings.json` contiene una cadena de conexión de ejemplo con `CHANGE_ME`.

La API espera que el esquema Sildra ya esté instalado; el inicio no crea todas las tablas principales.

## Iniciar la API

```powershell
cd src/SildraSupport.Api
dotnet run --urls http://127.0.0.1:5082
```

## Iniciar Angular

```powershell
cd src/Sildra
npm ci
npm start -- --host 127.0.0.1
```

Abre `http://127.0.0.1:4200` y comprueba el estado de la API en `http://127.0.0.1:5082/api/health`.
