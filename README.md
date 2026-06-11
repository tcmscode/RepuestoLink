# RepuestoLink (AppPesados)

Marketplace B2B argentino de repuestos para colectivos y camiones — intermediario tecnológico puro (sin stock, sin cobro, sin logística).

## Características MVP (alineado al plan de negocio v2)

- Roles: **comprador**, **vendedor**, **admin**
- **Categorías cruzadas A–D**: condición de pago (comprador) ↔ plazo de entrega (vendedor)
- **Cuatro listas de precio** por publicación: contado, 30, 60 y 90 días
- **Anonimato bilateral** hasta que el vendedor acepta la solicitud
- Flujo: borrador → intención comprador → **pendiente vendedor** → confirmado → entrega → factura → cerrado
- **Calificaciones 1–5 estrellas** post-cierre (comprador ↔ vendedor)
- Comisión **fija del 2%** al cerrar venta con factura
- **Panel de inteligencia comercial** para vendedores (`/vendedor/inteligencia`)
- Registro legal con KYC (aprobación manual)
- Sin pagos digitales — coordinación offline
- **Red cerrada**: alta solo manual por administrador (sin registro público)
- Login reforzado: contraseñas fuertes, bloqueo por intentos fallidos, sesión de 8 h
- Vendedores solo ven su stock/precios
- Compradores ven precios sin identidad del vendedor hasta confirmar
- Anti-abuso por cancelaciones sospechosas
- Bloqueo automático si el vendedor no carga factura a tiempo

## Requisitos

- Node.js 20+
- npm
- Docker (opcional, para Postgres local)

## Instalación local

```bash
docker compose up -d
cp .env.example .env
# Editá AUTH_SECRET en .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## Deploy en Railway

**Producción recomendada:** app + PostgreSQL en un solo lugar.

Guía completa paso a paso: **[DEPLOY-RAILWAY.md](./DEPLOY-RAILWAY.md)**

Resumen:

1. Proyecto en Railway desde GitHub
2. Agregar plugin **PostgreSQL** (ahí queda la base, sin Neon)
3. Variables: `AUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`
4. Volume en `/app/uploads` para facturas
5. `railway run npm run db:seed` una vez

## Usuarios demo (contraseña: `AppPesados2025!`)

| Email | Rol |
|-------|-----|
| admin@apppesados.com | Admin |
| vendedor1@apppesados.com | Vendedor |
| vendedor2@apppesados.com | Vendedor |
| comprador@apppesados.com | Comprador |

## Comisión

**2% fijo** sobre el total de cada venta cerrada con factura cargada (`COMMISSION_PERCENT` en env).

## Alta de usuarios

1. **Solicitud pública** en `/registro` con CUIT, categoría A–D y verificación ARCA/AFIP.
2. **Automatización** al superar 50 solicitudes/mes (o `ACCESS_AUTOMATION_ENABLED=true`).
3. **Alta manual** admin en `/admin/altas` cuando haga falta revisión humana.

## Categorías de negocio

| Cat. | Comprador (pago) | Vendedor (entrega) |
|------|------------------|---------------------|
| A | Contado / al día | Al día siguiente |
| B | 30 días | 2–3 días |
| C | 60 días | 4–5 días |
| D | 90+ días | +5 días |

Un comprador cat. B solo ve vendedores cat. B y el precio de su lista (30 días).

## Plazos de factura

El vendedor elige al publicar: **15 días, 1 mes, 2 meses o 3 meses** (máximo) post-entrega.

## Cron jobs (ejecutar diariamente)

```bash
# Facturas de venta vencidas (bloquea vendedor sin factura al comprador)
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tu-app/api/cron/check-invoices

# Facturación mensual comisiones plataforma + suspensión por impago
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tu-app/api/cron/monthly-commissions

# Recategorización periódica compradores (cada 90 días)
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tu-app/api/cron/recategorize
```

## Variables de entorno

Ver `.env.example`

## Stack

- Next.js 16 (App Router)
- Prisma + PostgreSQL
- NextAuth v5
- Tailwind CSS
- Railway (hosting)
