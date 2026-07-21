# Pago con PayPal — TallerLink

## Tu link
**https://www.paypal.com/paypalme/RandallCastroR9**

Integrado en la app como:

| Plan | Link generado |
|------|----------------|
| Pro $29 | `https://www.paypal.com/paypalme/RandallCastroR9/29USD` |
| Body Shop $49 | `https://www.paypal.com/paypalme/RandallCastroR9/49USD` |

---

## Flujo del taller

1. Se registra gratis  
2. **Plan y pago → Pagar con PayPal**  
3. Se abre el modal  
4. **Abrir PayPal y pagar** (monto del plan)  
5. En la nota de PayPal pone su **email del taller**  
6. Vuelve y toca **Ya pagué — activar plan**  
7. Queda Pro/Body Shop por **30 días**  
8. Para renovar: otra vez **Pagar con PayPal**

---

## Tu ritual como dueño de TallerLink

Cada vez que alguien active Pro:

1. Abrí PayPal → Actividad  
2. Buscá el pago de $29 o $49  
3. Verificá que el email/nombre coincida  
4. Si **no** hay pago: contactalo o desactivá (en su browser: Plan → Free)  

> La activación es “honor system” + tu revisión en PayPal.  
> No hay cobro automático recurrente: el taller renueva cada mes desde la app.

---

## Cambiar el link de PayPal

En `js/billing.js`, arriba:

```js
const PAYPAL = {
  me: 'RandallCastroR9',
  base: 'https://www.paypal.com/paypalme/RandallCastroR9',
  supportWa: '', // opcional: '5068...'
};
```

---

## Stripe

Queda en el repo por si más adelante cobrás fuera de CR o con entidad US.  
**El flujo principal de la UI ahora es PayPal.me.**

---

## Tips

- Pedí siempre que pongan el **email del taller** en el concepto de PayPal  
- Anotá en un Sheet: fecha · email · plan · monto · OK  
- A los 25 días del periodo podés mandar WA: “Renová Pro con el botón de la app”  
