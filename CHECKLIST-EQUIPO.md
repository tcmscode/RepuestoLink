# RepuestoLink — Checklist del equipo

Documento para alinear al grupo: qué tenemos, qué probar y qué falta.

---

## Copiar al WhatsApp

Enviá los 3 bloques siguientes al grupo (uno por mensaje).

### Mensaje 1 — Qué es y dónde entrar

```
📌 REPUESTOLINK — ESTADO DEL PROYECTO

✅ MVP desplegado y funcionando
🌐 https://repuestolink-production.up.railway.app
📦 Código: github.com/tcmscode/RepuestoLink

Qué es: marketplace B2B de repuestos para colectivos/camiones.
Intermediario tecnológico: NO maneja stock, cobros ni envíos.

Usuarios demo (contraseña para todos):
AppPesados2025!

• admin@apppesados.com → Admin
• vendedor1@apppesados.com → Vendedor
• vendedor2@apppesados.com → Vendedor
• comprador@apppesados.com → Comprador (Cat. B)

⚠️ Si no pueden entrar: avisar — hay que correr el seed en Railway.
```

### Mensaje 2 — Prueba obligatoria (30 min, 3 personas)

```
🧪 CHECKLIST DEMO — RepuestoLink
(Marcar ✅ cuando cada uno lo haga)

PARTICIPANTES SUGERIDOS:
👤 Persona A = Comprador
👤 Persona B = Vendedor
👤 Persona C = Admin

—— COMPRADOR (comprador@apppesados.com) ——
☐ 1. Ingresar → buscar "diferencial" o "Scania"
☐ 2. Verificar: NO se ve nombre del vendedor en el catálogo
☐ 3. Agregar al carrito → Carrito → Generar pedido
☐ 4. Entrar al pedido → "Confirmar intención de compra"
☐ 5. Verificar: sigue sin verse identidad del vendedor hasta que acepte

—— VENDEDOR (vendedor1@apppesados.com) ——
☐ 6. Pedidos → ver solicitud ANÓNIMA (solo cat. pago + zona)
☐ 7. "Aceptar pedido"
☐ 8. Verificar: ahora SÍ se ve el comprador
☐ 9. "Marcar entregado"
☐ 10. "Cargar factura" (nº factura + archivo o manual)

—— ADMIN (admin@apppesados.com) ——
☐ 11. Facturas → Aprobar la factura del pedido
☐ 12. Comisiones → ver comisión 2% generada
☐ 13. (Opcional) Pedidos / Abuso / Altas — recorrer menú

—— CIERRE (Comprador + Vendedor) ——
☐ 14. Comprador: calificar 1-5 estrellas al vendedor
☐ 15. Vendedor: calificar al comprador

📝 Anotar en el grupo cualquier cosa confusa, rota o que falte.
```

### Mensaje 3 — Pendientes y prioridades

```
📋 PENDIENTES DEL EQUIPO (prioridad)

URGENTE — estabilidad prod
☐ Volume en Railway: /app/uploads + variable UPLOAD_DIR
   (sin esto las facturas se pierden al reiniciar)
☐ Crons diarios en cron-job.org (3 URLs + CRON_SECRET):
   • /api/cron/check-invoices
   • /api/cron/monthly-commissions
   • /api/cron/recategorize
☐ Confirmar seed de usuarios demo en producción

IMPORTANTE — validación
☐ Todos completar la demo de arriba
☐ Listar mejoras de UX (textos, botones, flujo)
☐ Definir 1 vendedor + 1 comprador real para piloto

DESPUÉS — pulido
☐ Mejorar diseño (landing, login, catálogo, pedidos)
☐ Textos legales + FAQ en la web
☐ Emails automáticos (alta aprobada, pedidos)
☐ Dominio propio (ej. repuestolink.com.ar)
☐ AFIP/ARCA real (ahora está en modo mock)

🎯 META SEMANA 1:
"¿Un comprador y un vendedor pueden cerrar una operación de punta a punta?"
Si la respuesta es SÍ → pasamos a diseño y piloto real.
```

---

## Detalle ampliado (referencia)

### Qué ya está hecho

| Área | Estado |
|------|--------|
| Deploy Railway + Postgres | ✅ |
| Roles comprador / vendedor / admin | ✅ |
| Categorías A–D cruzadas | ✅ |
| 4 listas de precio por repuesto | ✅ |
| Anonimato hasta aceptación vendedor | ✅ |
| Flujo pedido completo | ✅ |
| Comisión 2% + facturación mensual | ✅ |
| Verificación CUIT (mock AFIP) | ✅ demo |
| Panel inteligencia vendedor | ✅ |
| Detección abuso / puenteo | ✅ |

### Flujo del pedido (estados)

```
borrador
  → comprador confirma intención
pendiente_vendedor  (vendedor NO ve identidad comprador)
  → vendedor acepta
confirmado  (se revelan identidades)
  → vendedor marca entregado
factura_pendiente
  → vendedor carga factura
factura_revision
  → admin aprueba
cerrado
  → ambos califican 1-5 estrellas
```

### Reglas de negocio clave

- Comprador cat. B solo ve vendedores cat. B y precio de 30 días.
- En catálogo el comprador nunca ve quién vende.
- Pago y entrega son offline entre las partes.
- Alta nueva: `/registro` → admin aprueba en `/admin/altas` o `/admin/solicitudes`.
- AFIP hoy es simulado (`AFIP_MOCK=true`); alcanza para demo y piloto.

### Paneles por rol

| Rol | URL principal | Qué hace |
|-----|---------------|----------|
| Comprador | `/comprador` | Buscar, carrito, pedidos, comparar |
| Vendedor | `/vendedor` | Stock, pedidos, comisiones, inteligencia |
| Admin | `/admin` | Altas, facturas, comisiones, abuso, empresas |

### Responsabilidades sugeridas del equipo

| Tarea | Quién puede encargarse |
|-------|------------------------|
| Completar demo y reportar bugs | Todos |
| Configurar Volume + crons Railway | Técnico / quien tenga acceso Railway |
| Mejoras de diseño y copy | Diseño / marketing |
| Contactar vendedor/comprador piloto | Comercial / socios |
| Revisar plan de negocio vs app | Socios |

### Si algo falla en la demo

| Problema | Solución |
|----------|----------|
| Login no funciona | Verificar seed en prod |
| Catálogo vacío | Correr `railway run npm run db:seed` |
| Error al subir factura | Falta Volume `/app/uploads` |
| Sesión / login raro | `NEXTAUTH_URL` debe ser `https://repuestolink-production.up.railway.app` |

---

Última actualización: junio 2026 · Repo: [tcmscode/RepuestoLink](https://github.com/tcmscode/RepuestoLink)
