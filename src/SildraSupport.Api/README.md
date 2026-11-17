# Sildra Support API

La API consulta el esquema PostgreSQL de Sildra (`tenant`, `branch`, `ticket`, `sla_clock`, `ticket_timeline`, `assignment` y `ticket_number_counter`). No ejecuta las migraciones EF antiguas del prototipo, porque crean tablas con nombres y columnas diferentes.

## Configuración

1. Copia `.env.example` a `.env` si todavía no existe y configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` con las credenciales de PostgreSQL.
2. Configura `ADMIN_EMAIL`, `ADMIN_PASSWORD` y, opcionalmente, `ADMIN_NAME`. El primer inicio de sesión del administrador crea o actualiza su rol local.
3. Para enviar el aviso de bienvenida al correo registrado, configura también `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` y `SMTP_USE_SSL` en `.env`. Sin estos datos la cuenta se crea, pero la API no puede entregar el correo.
4. Para el asistente de voz, configura `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` y `LIVEKIT_AGENT_NAME` en `.env`. Usa las credenciales y la URL del mismo proyecto de LiveKit. El nombre debe coincidir con el nombre de despacho (`agent_name`/`agentName`) de tu agente; `SildraBot` en el ejemplo es el valor visible en tu panel y debes cambiarlo si el nombre de despacho configurado en el agente es distinto. La clave secreta solo se usa en la API y nunca debe ponerse en Angular.
5. Para levantar PostgreSQL en Docker con el respaldo del proyecto, inicia Docker Desktop y ejecuta desde esta carpeta:

   ```powershell
   docker compose --env-file .env -f docker-compose.local.yml up -d db
   ```

   El respaldo SQL se importa al crear el volumen por primera vez. El volumen `sildra-postgres-data` conserva la base entre reinicios.
6. Inicia la API desde esta carpeta:

   ```powershell
   dotnet run --urls http://127.0.0.1:5080
   ```

7. Inicia Angular desde `src\Sildra`:

   ```powershell
   npm run start -- --host 127.0.0.1
   ```

## Cuentas y datos

- Al iniciar, la API crea de forma aditiva la tabla `app_user` y un índice para buscar los reportes por solicitante. No elimina ni reemplaza tablas del esquema existente.
- Las cuentas registradas desde la página tienen rol `User` y quedan ligadas al tenant de la sucursal seleccionada.
- El administrador puede consultar todos los tickets. Un usuario normal consulta los reportes que creó dentro de su tenant.
- Los tickets se guardan en `ticket`; su SLA de resolución se guarda en `sla_clock`. Un proceso de fondo actualiza `breach_at` cada 30 segundos cuando un ticket activo supera su fecha límite.
- `/api/health` solo devuelve estado conectado cuando PostgreSQL responde y están presentes las tablas que usa la aplicación.

La API asume que el esquema DBML descrito por el proyecto ya fue aplicado a PostgreSQL. La columna `tenant.organization_id` se usa como referencia externa y la administración de tenants de Keycloak no está integrada en esta aplicación.
