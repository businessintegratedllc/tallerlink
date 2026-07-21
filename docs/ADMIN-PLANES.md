# Cómo bajar a Free un taller que no pagó

## El problema
El botón **“Ya pagué”** activa Pro en el navegador del taller (honor system + PayPal.me).
Si alguien miente, necesitás poder **revocar** el plan.

## Solución
1. Panel admin: **`/admin.html`**
2. Servidor guarda el plan por email (Netlify Blobs)
3. La app del taller consulta el plan al abrir y cada 20 s
4. Si pusiste **Free / blocked**, el taller pierde Pro

---

## Setup (una vez)

### 1. Netlify → Environment variables
```
ADMIN_SECRET=mi-clave-super-secreta-larga-2026
```

### 2. Clear cache and deploy

### 3. Abrí
```
https://TU-SITIO.netlify.app/admin.html
```

### 4. Pegá la misma clave y “Guardar clave en este navegador”

---

## Uso diario

### Caso: no pagó en PayPal
1. Abrí PayPal → no está el cobro de $29/$49  
2. `/admin.html`  
3. Email del taller (el del registro)  
4. **Bajar a Free (no pagó)**  
5. Cuando el taller abra o recargue TallerLink → vuelve a Free  

### Caso: sí pagó y querés activar vos
1. Email  
2. Plan: Pro o Body Shop  
3. Días: 30  
4. **Activar / extender plan**  

### Lista
**Actualizar lista** muestra los últimos emails tocados desde el admin.

---

## Sin servidor (emergencia)
Si aún no deployaste admin:

Decile al taller que en la consola del navegador (F12) pegue:

```js
// Bajar a Free a mano en SU computadora
const b = JSON.parse(localStorage.getItem('tallerlink_billing_v1')||'{}');
b.plan='free'; b.status='active'; b.currentPeriodEnd=null;
localStorage.setItem('tallerlink_billing_v1', JSON.stringify(b));
location.reload();
```

Eso solo sirve si él coopera. El panel admin es la forma correcta.

---

## Seguridad
- No compartas `ADMIN_SECRET`
- No subas la clave a GitHub
- Si se filtra: cambiá `ADMIN_SECRET` en Netlify y redeploy
