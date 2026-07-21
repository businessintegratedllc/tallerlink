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

## Estructura

```
tallerlink/
├── index.html       # App completa del dueño + vista cliente
├── package.json
├── netlify.toml
├── README.md
└── docs/
```

---

## Precio objetivo (cuando cobre)

- Free: pocos vehículos  
- Pro ~$29–49/mes: ilimitado + logo + nube  
- Body Shop ~$69–99/mes: proyectos pintura + adicionales  

---

© TallerLink — herramienta operativa para dueños de taller.
