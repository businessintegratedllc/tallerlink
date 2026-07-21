# TallerLink

**El sistema del dueño de taller: ingreso, cotización, cola y presupuestos.**

Hecho para talleres de 1–8 personas en LatAm que viven en WhatsApp.

---

## Qué puede hacer el dueño (producto final)

| Módulo | Función |
|--------|---------|
| **Ingresar carro** | OT con cliente, placa, km, motivo, área (mecánica / enderezado / pintura) |
| **Cotización** | Ítems + IVA + link + aprobación del cliente por WhatsApp |
| **Cola del taller** | Tablero Kanban: arrastrá el carro entre Recibido → … → Pintura → Listo |
| **Presupuesto proyecto** | Etapas (desarme, chapa, pintura, armado) para choques |
| **Estados + WA** | Mensajes listos al cambiar de estado |
| **Inicio** | Cuántos carros hay, sin aprobar, en proceso, listos |

---

## Cómo usarlo (5 minutos)

```bash
cd tallerlink
npm start
# http://localhost:8080
```

1. **Mi taller** → nombre, WhatsApp, moneda, IVA  
2. **+ Ingresar carro** → datos del vehículo  
3. Pestaña **Cotización** → ítems → **Enviar WA**  
4. El cliente abre el link y toca **Aprobar**  
5. **Cola del taller** → arrastrá la tarjeta a Mecánica / Pintura / Listo  
6. **Estado y WA** → avisá “listo para retirar”

Hay datos demo la primera vez (RAV4, Tucson, Civic) para explorar.

---

## Flujo real del taller

```
Llega el carro
   → Ingreso (OT)
   → Diagnóstico
   → Cotización o presupuesto por etapas
   → Cliente aprueba en el link (WhatsApp)
   → Cola: mecánica / enderezado / pintura
   → Listo → Entregado
```

---

## Deploy

```bash
git remote add origin https://github.com/TU_USUARIO/tallerlink.git
git push -u origin main
```

Netlify → Import repo → publish directory `.` → Deploy.

---

## Privacidad del MVP

- Todo se guarda en el **navegador** del taller (`localStorage`)
- El link del cliente lleva los datos de esa cotización en la URL
- No hay servidor ni cuentas todavía (versión Pro: nube + multi-dispositivo)

---

## Plan de negocio y ejecución

- **Plan completo (90 días → 12 meses → $1M):** [`docs/PLAN-COMPLETO.md`](docs/PLAN-COMPLETO.md)
- **Pago con PayPal (principal):** [`docs/PAYPAL.md`](docs/PAYPAL.md) → [paypal.me/RandallCastroR9](https://www.paypal.com/paypalme/RandallCastroR9)
- **Suscripciones (histórico Stripe):** [`docs/SUSCRIPCIONES.md`](docs/SUSCRIPCIONES.md)
- **Manual del dueño:** [`docs/MANUAL-DUENO.md`](docs/MANUAL-DUENO.md)

## Aprobaciones del cliente (importante)

Cuando el cliente toca **Aprobar** en el link de WhatsApp, la decisión se guarda en el servidor (Netlify Blobs) y el panel del taller se actualiza solo (cada ~12s o botón **↻ Sync**).

Requiere la app **deployada en Netlify** (no solo abrir el HTML en el disco).

## Estructura

```
tallerlink/
├── index.html              # App dueño + vista cliente
├── js/billing.js           # Registro, planes, límites, Stripe
├── netlify/functions/      # Checkout, portal, webhook
├── package.json
├── netlify.toml
├── README.md
└── docs/
    ├── PLAN-COMPLETO.md
    ├── SUSCRIPCIONES.md
    └── MANUAL-DUENO.md
```


---

## Precio objetivo (cuando cobre)

- Free: pocos vehículos  
- Pro ~$29–49/mes: ilimitado + logo + nube  
- Body Shop ~$69–99/mes: proyectos pintura + adicionales  

---

© TallerLink — herramienta operativa para dueños de taller.
