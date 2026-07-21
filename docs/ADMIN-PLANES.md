# Cómo bajar a Free un taller que no pagó

## Si el admin dice `blobs_unavailable`

Eso significa que Netlify no pudo abrir el almacenamiento Blobs.

### Arreglo (en orden)

1. **Confirmá que `netlify.toml` tiene:**
   ```toml
   command = "npm install --omit=dev"
   ```
   (Sin esto, `@netlify/blobs` no se instala y falla todo.)

2. **GitHub:** push del último código.

3. **Netlify → Environment variables**
   ```
   ADMIN_SECRET=tu-clave-secreta-larga
   APP_URL=https://tu-sitio.netlify.app
   ```

4. **Deploys → Trigger deploy → Clear cache and deploy site**  
   Esperá el deploy **verde**.

5. Abrí **exactamente**:
   ```
   https://TU-SITIO.netlify.app/admin.html
   ```
   No uses `file://` ni solo `python -m http.server` (ahí no hay Functions).

6. Pegá la **misma** clave `ADMIN_SECRET` en el campo del admin.

7. Probá **Consultar email** o **Bajar a Free**.

### Ver logs
Netlify → **Functions** → `admin-plan` → mirá el error completo en el log del request.

---

## Setup normal (una vez)

1. `ADMIN_SECRET` en Netlify  
2. Clear cache deploy  
3. `https://TU-SITIO.netlify.app/admin.html`  
4. Guardar clave en el navegador  

## Uso: no pagó PayPal

1. PayPal → no está el cobro  
2. Admin → email del taller  
3. **Bajar a Free (no pagó)**  
4. El taller, al abrir/recargar la app, pierde Pro  

## Uso: sí pagó

1. Email  
2. Plan Pro o Body Shop  
3. Días 30  
4. **Activar / extender plan**  

---

## Seguridad
- No subas `ADMIN_SECRET` a GitHub  
- Si se filtra, cambiala en Netlify y redeploy  
