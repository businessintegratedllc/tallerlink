# TallerLink — Plan completo de ejecución

**Versión:** 1.0 · Julio 2026  
**Producto:** Sistema operativo del taller chico (ingreso, cotización, cola, presupuestos, WhatsApp, suscripción)  
**Mercado inicial:** Costa Rica (GAM) → Centroamérica → México  
**Precio:** Free · Pro $29/mes · Body Shop $49/mes  

---

## 0. Norte en una página

### Misión
Que ningún taller chico pierda bahía ni margen por cotizar en chats desordenados y no saber “cuál carro sigue”.

### Visión (36 meses)
Ser el sistema WhatsApp-first por defecto de talleres independientes en español en LatAm.

### No somos
- ERP contable completo  
- Inventario de repuestera  
- Tekmetric a $200  
- App de referidos / wellness  

### Promesa al dueño
> Entrá el carro → cotizá → el cliente aprueba por WhatsApp → mirá la cola → avisá cuando esté listo.

### Métrica norte (única)
**Cotizaciones enviadas con decisión del cliente (sí/no) en < 2 horas**, por taller activo / semana.

### Métricas de apoyo
| Métrica | Objetivo mes 3 | Objetivo mes 12 |
|---------|----------------|-----------------|
| Talleres registrados | 80 | 600 |
| Talleres que usan cola ≥3 días/sem | 25 | 200 |
| Talleres de pago (MRR) | 15 (~$450 MRR) | 120 (~$4k MRR) |
| Churn mensual pagos | < 8% | < 4% |
| Tiempo a primera cotización WA | < 15 min onboarding | < 10 min |

---

## 1. Situación actual (punto de partida)

### Ya construido
- [x] App dueño: OT, cotización, Kanban, presupuesto proyecto, estados  
- [x] Vista cliente + aprobación  
- [x] Share sheet WhatsApp (sin API Meta)  
- [x] Registro taller + planes Free/Pro/Body Shop  
- [x] Stripe Checkout + verify + portal + webhook stub (Netlify Functions)  
- [x] Repo listo GitHub/Netlify  

### Falta para “negocio de verdad”
- [ ] Deploy producción + dominio  
- [ ] Stripe **live** configurado  
- [ ] 20–50 talleres usando de verdad  
- [ ] Auth + nube (multi-dispositivo)  
- [ ] Playbook de venta puerta a puerta validado  

---

## 2. Estrategia general (12 meses)

```
Q1 (días 1–90)     Fundar: deploy, 50 demos, 15 pagos, aprender
Q2 (días 91–180)   Retener: nube/login, reducir churn, 40 pagos
Q3 (días 181–270)  Canal: 2 partners repuestos/pintura, 80 pagos
Q4 (días 271–365)  Expandir: 2ª ciudad o 2º país, Body Shop fuerte, ~120 pagos
```

**Filosofía:** distribución > features.  
No construir inventario hasta que 30 talleres paguen y lo pidan por escrito.

---

## 3. Plan 90 días (detalle semanal)

### Semana 0 — Lanzamiento técnico (3–5 días)

**Objetivo:** URL pública estable + cobro testable.

| # | Tarea | Done cuando |
|---|--------|-------------|
| 0.1 | Push repo a GitHub `tallerlink` | repo público/privado online |
| 0.2 | Netlify connect + deploy | https://xxx.netlify.app carga app |
| 0.3 | Dominio (opcional): tallerlink.app / .cr | HTTPS verde |
| 0.4 | Stripe cuenta + productos Pro/Body Shop | price_ids |
| 0.5 | Env vars Netlify (test) | checkout test con 4242… |
| 0.6 | Probar registro → free → upgrade demo | flujo completo en video de 3 min |
| 0.7 | WhatsApp Business del producto (tu número) | para soporte a talleres |

**Entregable:** link que podés mandar a un taller hoy.

---

### Semanas 1–2 — Validación en la calle (no en el IDE)

**Objetivo:** 20 demos presenciales · 10 talleres con ≥1 cotización real enviada.

**Territorio (CR ejemplo):**
- Pavas / La Uruca / Desamparados / Cartago / Heredia — zonas de talleres  
- 2–3 mañanas/semana, 8:30–11:30  

**Script de entrada (30 segundos):**
> “Disculpe, ¿usted cotiza por WhatsApp? Armé esto para no perder el carro en el elevador esperando el sí del cliente. ¿Me regala 6 minutos con el próximo carro que entre?”

**Demo en el taller (6–8 min):**
1. Registrarlo (email real)  
2. Ingresar el carro que está en el patio  
3. Cotización con 3 ítems reales  
4. Mandar/copiar WA al dueño (él se lo reenvía a un cliente de prueba o a sí mismo)  
5. Mostrar cola: arrastrar a “Mecánica”  
6. Dejar Free · pedir permiso para volver en 5 días  

**No hacer:** pitch de 20 minutos, hablar de IA, comparar con SAP.

**Tracking (Google Sheet simple):**

| Fecha | Taller | Zona | Contacto | WA | Demo | Cotiz. real | Objeción | Seguimiento |
|-------|--------|------|----------|----|------|-------------|----------|-------------|

**Meta numérica semana 2:**
- 20 demos  
- 10 cuentas con actividad  
- 5 objeciones repetidas documentadas  

---

### Semanas 3–4 — Activación y primer dinero

**Objetivo:** 30 cuentas · 8 talleres “activos” · 3–5 pagos (o trials serios).

**Definición taller activo:**  
≥ 5 cotizaciones enviadas en 14 días **o** cola usada ≥ 4 días.

**Ritual de seguimiento:**
- Día 1 post-demo: WA “¿Pudieron mandar la del [placa]?”  
- Día 5: “¿Cuántos sí/no les llegaron?”  
- Día 12: oferta Pro con caso: “Ustedes mandaron 12 cotizaciones; Free se queda corto en 15”  

**Conversión Free → Pro (ofertas permitidas mes 1):**
- Primeros 10: Pro $19/mes x 3 meses (código Stripe)  
- O trial 14 días + cargo día 15  

**Producto mínimo a parchar solo si bloquea adopción:**
1. Onboarding más tonto (checklist 4 pasos en Inicio)  
2. Plantillas de ítems (frenos, aceite, clutch)  
3. Logo del taller en link cliente (Pro)  

**No construir aún:** inventario, FE, app nativa, multi-sucursal.

---

### Semanas 5–6 — Sistema de ventas repetible

**Objetivo:** playbook escrito + 40 demos acumuladas + 8–12 pagos.

**Playbook (1 página):**
- Mapa de zonas  
- Horarios que funcionan  
- Objeciones y respuestas  
- Criterio de “taller ideal”  

**Taller ideal (ICP):**
- 2–8 personas  
- Dueño en el piso  
- Ya cotiza por WA  
- Al menos 3–4 carros/día  
- Enderezado/pintura = bonus (Body Shop)  

**Respuestas a objeciones:**

| Objeción | Respuesta |
|----------|-----------|
| “Eso lo hago en el chat” | “Sí; el chat no te dice cuál está en espera de sí ni el total claro. Probemos con el de la bahía 2.” |
| “No tengo tiempo” | “6 minutos con un carro real; si no sirve no vuelvo.” |
| “Ya tengo sistema” | “¿El cliente aprueba en un toque y ves la cola de pintura? Si sí, genial.” |
| “Está caro” | “Un freno mal cobrado paga el mes. Free existe.” |
| “Y si se cae el internet” | “Podés copiar el mensaje; el link lo abre el cliente en su red.” |

**Contenido ligero (1h/semana, no más):**
- 4 capturas de pantalla + 1 reel: “Del WhatsApp caótico al sí en 2 minutos”  
- Grupos FB de mecánicos CR/MX: ayudar, no spamear  

---

### Semanas 7–8 — Retención y producto de hábito

**Objetivo:** churn temprano < 10% · feature que aumenta “días activos/semana”.

**Medir por taller:**
- Días con ≥1 movimiento en cola  
- Cotizaciones / semana  
- % aprobadas  

**Mejoras prioritarias (elegir solo 2):**
1. **Recordatorio** “tenés 3 sin aprobar hace >4h” (lista en Inicio)  
2. **Plantillas** de servicios  
3. **Promesa de entrega** visible en ticket de cola  
4. **Multi-dispositivo read-only** (si ya duele) → acelera nube  

**Llamadas de éxito (8 talleres activos):**
- “¿Qué haría falta para no poder trabajar sin esto?”  
- Anotar palabras textuales → copy de la landing  

---

### Semanas 9–10 — Canal partner (semilla)

**Objetivo:** 1 partner trayendo talleres.

**Partners ideales:**
- Pinturerías automotrices  
- Distribuidores de repuestos que visitan talleres  
- Aseguradoras chicas / gestores de siniestros (más lento)  

**Oferta partner:**
> “Le dejamos a sus clientes un sistema de cotización/cola. Usted queda como el que les ordenó el patio. Si quieren, link con su marca en el pie.”

**Comisión posible (mes 10+):** 20% del primer año o 1 mes gratis al taller referido.

**Meta:** 5 talleres referidos por partner o 1 alianza firmada en WA (informal OK).

---

### Semanas 11–12 — Cierre del trimestre

**Objetivo mes 3:**

| KPI | Target mínimo | Target ambicioso |
|-----|---------------|------------------|
| Demos totales | 50 | 80 |
| Cuentas registradas | 60 | 100 |
| Activos | 20 | 35 |
| Pagando | 12 | 20 |
| MRR | $350 | $700 |
| NPS / “lo recomendaría” | 8/10 en 10 entrevistas | 9/10 |

**Ritual de cierre día 90:**
1. Lista de lo que se usó de verdad vs lo que ignoraron  
2. Matar 3 features del backlog que nadie pidió  
3. Decidir: ¿nube ya o más distribución?  
4. Actualizar precios solo si >15 pagos y nadie se queja del valor  

**Criterio GO / NO-GO a Q2**

| Señal | Decisión |
|-------|----------|
| ≥10 pagos y ≥15 activos | GO: invertir en auth+nube |
| 5–9 pagos | GO condicional: 30 días más solo ventas |
| <5 pagos | Pausar features; solo demos + reescribir oferta |

---

## 4. Plan 12 meses (por trimestres)

### Q1 — Encajar (este doc, días 1–90)
- Deploy + Stripe  
- 50+ demos  
- 12–20 pagos  
- Playbook de venta  
- 2 mejoras de activación  

### Q2 — Multi-dispositivo y retención
**Producto**
- Login magic link (email)  
- DB (Supabase recomendado): `shops`, `users`, `ots`, `subscriptions`  
- Sync OT entre aparatos  
- Webhook Stripe escribe plan en `shops`  
- Fotos de ingreso (opcional, muy pedida)  

**Negocio**
- 40–60 pagos  
- Churn < 5%  
- 1 empleado part-time ventas o closer por comisión  
- Segunda zona geográfica  

### Q3 — Canal y ARPU
**Producto**
- Logo + marca en link cliente  
- Adicionales de presupuesto con nueva aprobación  
- Reportes simples: tiempo medio a aprobación, bahías  
- Export CSV  

**Negocio**
- 2 partners activos  
- Body Shop 20% del mix de pagos  
- Probar $39 Pro si valor claro  
- Primer contenido SEO que posicione (“software taller WhatsApp Costa Rica”)  

### Q4 — Expansión controlada
**Producto**
- Multi-país (impuesto/moneda ya existe; copy local)  
- Integración liviana contable **o** guía FE (no construir FE completa)  
- Roles: dueño / recepción (permisos simples)  

**Negocio**
- 100–150 talleres pagos  
- MRR $3.5k–6k  
- Decidir país 2 (México suele ser el salto de escala)  
- Evaluar seed/ángeles solo si el canal partner escala sin tu presencia física  

---

## 5. Camino a $1M ARR (mapa realista)

### Matemática
| ARPU | Talleres para $1M ARR |
|------|----------------------|
| $30/mes | ~2.780 |
| $40/mes | ~2.080 |
| $50/mes | ~1.670 |

### Tres motores (en orden)
1. **Ventas directas + referidos de talleres** (años 1–2)  
2. **Partners repuestos/pintura** (año 2)  
3. **PLG + SEO + marca en links de cliente** (año 2–3)  

### Hitos de revenue
| Momento | MRR | Qué debe ser verdad |
|---------|-----|---------------------|
| Mes 3 | $0.4–0.7k | Oferta y demo funcionan |
| Mes 6 | $1.5–2.5k | Nube + retención |
| Mes 12 | $4–6k | Canal repetible 1 país |
| Mes 24 | $15–25k | 2 países o partners fuertes |
| Mes 36 | $40k+ | Camino visible a $1M ARR |

**No hay atajo mágico:** $1M es ~2.000 talleres. Eso es distribución industrial, no un feature más.

---

## 6. Producto — roadmap priorizado

### P0 — No negociable (ya / inmediato)
- Registro + Free limits  
- OT + cotización + WA share  
- Cola Kanban  
- Stripe checkout  
- Estabilidad mobile  

### P1 — Activación (Q1)
- Checklist “primer carro” en Inicio  
- Plantillas de ítems  
- Banner “3 sin aprobar”  
- Mejoras copy onboarding  

### P2 — Retención (Q2)
- Auth + DB + sync  
- Fotos ingreso  
- Portal Stripe pulido  
- Notificaciones email semanal al dueño (“tu semana en el taller”)  

### P3 — Dinero extra (Q3)
- Logo Pro  
- Adicionales versionados  
- Seña / saldo a pagar (instrucciones Sinpe + mark paid)  
- Reportes  

### P4 — Solo con demanda escrita de ≥15 talleres
- Inventario básico  
- Factura electrónica (integración proveedor local)  
- App stores  
- Multi-sucursal  

### Explicitamente fuera de scope 12 meses
- Marketplace de talleres al consumidor masivo  
- IA de diagnóstico automotriz  
- Red social de mecánicos  
- Crypto / tokens  

---

## 7. Go-to-market completo

### Canales (prioridad)

| # | Canal | Costo | Velocidad | Notas |
|---|-------|-------|-----------|-------|
| 1 | Puerta a puerta zonas talleres | Tiempo | Alta | Core Q1–Q2 |
| 2 | WhatsApp a talleres conocidos | Bajo | Alta | Lista de 50 fríos/calientes |
| 3 | Referidos (“traé un taller = 1 mes”) | Bajo | Media | Activar mes 2 |
| 4 | Partners repuestos/pintura | Medio | Media | Q2–Q3 |
| 5 | SEO local | Bajo | Lenta | Empezar mes 2, cosecha mes 8+ |
| 6 | Ads Meta | Medio | Media | Solo con creativo probado en calle y CAC medido |

### Embudo

```
Visita / mensaje
  → Demo 6 min con carro real
    → Cuenta Free creada
      → 1ª cotización WA (mismo día)
        → 5 cotizaciones en 14 días (activo)
          → Hit límite o pitch valor
            → Trial / Pro
              → Mes 2 pagado (retenido)
```

### CAC y LTV (targets)
- CAC objetivo venta directa: < $40 (tu tiempo + transporte)  
- LTV a 18 meses @ $29 y churn 4%: ~$29 × 0.96^n ≈ **$400–500**  
- LTV/CAC > 3  

### Branding y mensaje
- **Nombre:** TallerLink  
- **Tagline:** Cotizá. Aprobá. Seguí la cola.  
- **Enemigo:** el chat infinito y la bahía parada  
- **Prueba:** tiempo a sí del cliente + carros movidos/día  

---

## 8. Operación semanal del founder (ritmo)

### Semana tipo (solo founder)

| Bloque | Horas | Qué |
|--------|------|-----|
| Calle / demos | 10–12 | Visitas talleres |
| Seguimiento WA | 4 | Activar free users |
| Producto | 6–8 | Solo P0/P1 del board |
| Admin/Stripe/soporte | 2 | Tickets, billing |
| Contenido | 1 | 1 post o reel |
| **Total** | **~25–30** | Sostenible si hay otro laburo; full-time subir calle a 15h |

### Rituales
- **Lunes:** revisar métricas (activos, pagos, churn)  
- **Viernes:** 3 llamadas de éxito  
- **Domingo 20 min:** planificar zonas de la semana  

---

## 9. Stack y arquitectura (evolución)

### Ahora (MVP)
```
Frontend estático (index.html + js/billing.js)
  → localStorage (OT + billing local)
  → Netlify Functions → Stripe
  → Links cliente ?c= payload
```

### Q2 (multi-dispositivo)
```
Frontend
  → Auth magic link (Supabase Auth)
  → Postgres (Supabase)
       shops, users, ots, quotes, audit_log
  → Stripe webhook → shops.plan
  → Storage fotos
```

### Costos infra estimados
| Etapa | $/mes |
|-------|------|
| Netlify + dominio | 0–25 |
| Supabase free → pro | 0–25 |
| Stripe fees | 2.9% + fijo |
| WA Business (tu chip) | plan local |
| Hasta 100 talleres | < $50 infra |

---

## 10. Finanzas del proyecto (founder)

### Costos fijos iniciales
| Ítem | $ |
|------|---|
| Dominio | 15/año |
| Transporte demos (mes) | 40–80 |
| Tiempo founder | el costo real |
| Stripe | % |

### Break-even personal (ejemplo)
Si querés $1,000/mes netos del producto:  
~40 talleres Pro @ $29 ≈ $1,160 bruto − Stripe ~$50 → ~$1,100.

### Uso del dinero si hay ingresos
1. Transporte y tiempo de venta  
2. Nube/auth  
3. Commission-only closer  
4. Ads solo con CAC conocido  

---

## 11. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Nadie abandona el chat suelto | Media | Alto | Demo con carro real; Free; prueba 14d |
| Churn alto mes 2 | Media | Alto | Onboarding; valor en cola no solo cotización |
| Pedido de FE/inventario descarrila foco | Alta | Medio | Lista de espera; no build hasta 15 pedidos |
| Stripe/local payments LatAm | Media | Medio | + Sinpe instrucciones; terminal después |
| Competidor local copia | Media | Medio | Velocidad en calle + partners |
| Quemarte en demos sin cerrar | Alta | Alto | ICP estricto; max 3 visitas sin actividad |
| localStorage pierde datos | Media | Alto | Backup export ASAP; nube en Q2 |

---

## 12. Legal y confianza (mínimo viable)

- [ ] Términos de uso (página simple)  
- [ ] Privacidad: qué se guarda, links cliente, Stripe  
- [ ] Disclaimer: no reemplaza facturación legal  
- [ ] Datos del taller son del taller (export)  
- [ ] Precio y cancelación claros  

No hace falta SRL el día 1; sí hace falta cuando MRR > $2k o contratos B2B.

---

## 13. Equipo

### Día 0–90
- **Vos:** producto + venta  

### Cuando MRR > $1.5k
- Closer part-time (% del primer pago / 20% año 1)  

### Cuando MRR > $4k
- Support half-time (WA)  
- Dev freelance por sprint (nube) si no codeás full-time  

### No contratar
- Marketing manager  
- Diseñador full-time  
- “Growth hacker”  

---

## 14. Segunda gran ola (después de TallerLink)

Solo si se cumplen:
- ≥ 80 talleres pagos  
- Churn < 4%  
- Partner canal funcionando  

**Opción A:** mismo playbook → **clínicas dentales/estética** (nuevo brand).  
**Opción B:** profundidad **seguros + body shop** en TallerLink.  

No abrir segunda ola antes.

---

## 15. Checklist de esta semana (empezar ya)

### Hoy
- [ ] Push a GitHub  
- [ ] Deploy Netlify  
- [ ] Stripe test products + env vars  
- [ ] Video demo 3 min (para mandar por WA)  

### Mañana–viernes
- [ ] Lista de 40 talleres (nombre, zona, WA si hay)  
- [ ] 8 visitas en persona  
- [ ] Sheet de tracking  
- [ ] 5 cuentas Free creadas en la calle  

### Domingo
- [ ] Revisar qué feature pidieron  
- [ ] Planificar 2 zonas de la semana 2  

---

## 16. Definición de éxito (para no autoengañarse)

### Éxito a 90 días
Podés decir en voz alta:

> “Hay N talleres que abren TallerLink cada mañana para la cola,  
> mandan cotizaciones por link, y M ya me pagan el mes.”

Con **N ≥ 15** y **M ≥ 10**, el plan sigue.  
Si no, no necesitás una idea nueva: necesitás más calle o un ICP más fino.

### Éxito a 12 meses
- MRR ≥ $4k  
- Un canal que genera talleres sin que vos estés en cada demo  
- Churn sano  
- Roadmap dictado por uso, no por aburrimiento  

---

## 17. Resumen ejecutivo

| Capa | Plan |
|------|------|
| **Producto** | Taller OS WhatsApp-first; no ERP |
| **Mercado** | Talleres 2–8 personas, dueño en piso, LatAm |
| **Precio** | Free wedge → $29 / $49 |
| **GTM** | Calle → referidos → partners → SEO |
| **90 días** | Deploy, 50 demos, 12–20 pagos, playbook |
| **12 meses** | Nube, retención, partners, ~100–150 pagos |
| **$1M** | ~2k talleres; 24–36 meses con ejecución seria |
| **Próxima idea** | No pivotar; o clínicas cuando esto cobre solo |

---

**Frase de guerra del plan:**  
> Un taller real por la mañana vale más que una feature por la noche.

---

*Documento vivo. Actualizar al cerrar cada mes con números reales.*
