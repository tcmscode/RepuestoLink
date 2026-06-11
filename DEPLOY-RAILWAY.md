# Deploy en Railway — RepuestoLink

Guía paso a paso (recomendado para este proyecto).
## 1. Crear cuenta y proyecto

1. Entrá a [railway.app](https://railway.app) y creá una cuenta.
2. **New Project** → **Deploy from GitHub repo** (conectá el repo de AppPesados)  
   O subí el código con Railway CLI.

## 2. Agregar PostgreSQL

1. En el proyecto: **+ New** → **Database** → **PostgreSQL**.
2. Railway crea la variable `DATABASE_URL` automáticamente.
3. En tu servicio **web** (Next.js): **Variables** → **Add reference** → elegí `DATABASE_URL` del servicio Postgres.

No hace falta configurar Neon: la base vive en Railway.

## 3. Variables de entorno (servicio web)

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | Referencia al plugin PostgreSQL |
| `AUTH_SECRET` | String aleatorio largo (32+ caracteres) |
| `NEXTAUTH_URL` | URL pública de tu app, ej. `https://app-pesados-production.up.railway.app` |
| `CRON_SECRET` | Secreto para los cron jobs |
| `AFIP_MOCK` | `true` en demo; `false` cuando tengas certificados AFIP |
| `UPLOAD_DIR` | `/app/uploads` (si usás Volume, paso 5) |

Generar secreto en PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 4. Dominio público

1. Servicio web → **Settings** → **Networking** → **Generate Domain**.
2. Copiá la URL y ponela en `NEXTAUTH_URL` (con `https://`).
3. Redeploy si cambiaste `NEXTAUTH_URL`.

## 5. Volume para facturas (recomendado)

Sin esto, las fotos/PDF de facturas se pierden al reiniciar el servidor.

1. Servicio web → **+** → **Volume**.
2. Mount path: `/app/uploads`
3. Variable: `UPLOAD_DIR=/app/uploads`

Las facturas se sirven por `/uploads/nombre-archivo`.

## 6. Primer deploy y datos demo

El deploy corre `prisma db push` al iniciar (crea tablas).

Para cargar usuarios demo **una sola vez**:

```bash
# Con Railway CLI instalado y logueado
railway link
railway run npm run db:seed
```

O desde el dashboard: servicio web → **Settings** → ejecutar comando con `npm run db:seed`.

## 7. Cron jobs (externo: cron-job.org)

Configurá **3 tareas diarias** con header `Authorization: Bearer TU_CRON_SECRET`:

| URL | Para qué |
|-----|----------|
| `/api/cron/check-invoices` | Facturas de venta vencidas |
| `/api/cron/monthly-commissions` | Factura mensual comisiones + suspensión |
| `/api/cron/recategorize` | Revisión categorías cada 90 días |

Ejemplo URL: `https://TU-DOMINIO.railway.app/api/cron/check-invoices`
## 8. Desarrollo local con la misma DB

```bash
docker compose up -d
cp .env.example .env
# Editá AUTH_SECRET en .env
npm run db:push
npm run db:seed
npm run dev
```

## Checklist antes de producción

- [ ] `NEXTAUTH_URL` = URL real con `https://`
- [ ] `AUTH_SECRET` distinto al de desarrollo
- [ ] Volume montado en `/app/uploads` + `UPLOAD_DIR`
- [ ] Cron configurado (3 URLs arriba)
- [ ] Seed ejecutado una vez
- [ ] Cambiar contraseñas demo o desactivar usuarios de prueba

## Costo aproximado

Railway tiene crédito mensual gratis (suele alcanzar para un MVP). Postgres + web + volume pequeño: revisá el plan en el dashboard.
