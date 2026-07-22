# Cómo convertir TallerLink en una “app”

TallerLink **ya es una aplicación web**. Hay 3 niveles. Empezá por el 1.

---

## Nivel 1 — PWA (recomendado ahora) ✅ en el código

**Qué es:** el usuario instala TallerLink en el celular/PC como una app (icono, pantalla completa), sin pasar por Play Store / App Store.

**Ya incluido:**
- `site.webmanifest`
- `sw.js` (service worker / caché)
- `js/pwa.js` (botón **Instalar app**)
- Iconos 192 / 512 / apple-touch

### Cómo lo instala el dueño del taller

#### Android (Chrome)
1. Abrir https://tallerlink.netlify.app
2. Menú ⋮ → **Instalar app** / **Agregar a la pantalla de inicio**
3. O el botón **⬇ Instalar app** dentro de TallerLink

#### iPhone / iPad (Safari)
1. Abrir el sitio en **Safari** (no Chrome)
2. Botón **Compartir**
3. **Añadir a pantalla de inicio**
4. Agregar

#### Windows / Mac (Chrome o Edge)
1. Abrir el sitio
2. Icono de instalar en la barra de direcciones, o menú → Instalar TallerLink

### Requisitos técnicos
- Sitio en **HTTPS** (Netlify ya lo da)
- Manifest + Service Worker activos (después del deploy de este código)

### Limitaciones PWA
- No aparece sola en Play Store / App Store (salvo que la envuelvas — Nivel 2/3)
- En iOS, notificaciones push son limitadas
- WhatsApp sigue abriéndose como app externa (está bien)

---

## Nivel 2 — App nativa con Capacitor (Play Store / App Store)

**Qué es:** la misma web, empaquetada como app Android/iOS real.

### Pasos (en tu Mac/PC con Node)

```bash
cd tallerlink
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init TallerLink com.tallerlink.app --web-dir .
```

Creá `capacitor.config.json`:

```json
{
  "appId": "com.tallerlink.app",
  "appName": "TallerLink",
  "webDir": "www",
  "server": {
    "url": "https://tallerlink.netlify.app",
    "cleartext": false
  }
}
```

> Con `server.url` la app carga **siempre tu web en Netlify** (más fácil: un solo código).  
> Alternativa: copiar archivos estáticos a `www/` y empaquetar offline (más trabajo con functions).

```bash
npx cap add android
npx cap add ios          # solo en Mac
npx cap open android     # Android Studio
npx cap open ios         # Xcode
```

### Publicar
| Tienda | Qué necesitás |
|--------|----------------|
| **Google Play** | Cuenta desarrollador ~$25 una vez, AAB firmado, fichas, política de privacidad |
| **Apple App Store** | Cuenta Apple Developer $99/año, Mac, Xcode, revisión Apple (más estricta) |

### Coste / tiempo realista
- Android PWA-wrapper: 1–3 días técnicos + revisión Play  
- iOS: 1–2 semanas (cuenta, certificados, revisión)

---

## Nivel 3 — App nativa “de verdad” (React Native / Flutter)

Reescribir la UI en nativo.

**No lo recomiendo ahora:**  
duplicás mantenimiento y TallerLink ya funciona bien como web + PWA.  
Solo tiene sentido con >500 talleres y necesidad fuerte de offline/cámara/push avanzado.

---

## Qué te conviene a vos (orden)

| Prioridad | Acción | Para qué |
|-----------|--------|----------|
| **1** | Deploy PWA (este código) | Icono en el celu del taller **hoy** |
| **2** | En el speech: “se instala como app en 10 segundos” | Venta |
| **3** | Capacitor Android cuando tengas 30–50 talleres pagos | Play Store |
| **4** | iOS solo si te lo piden mucho | App Store cara y lenta |

---

## Checklist deploy PWA

- [ ] Push a GitHub del código con `sw.js` + `js/pwa.js`
- [ ] Netlify deploy verde
- [ ] Abrir https://tallerlink.netlify.app en Chrome Android
- [ ] Ver opción Instalar / botón en la app
- [ ] Abrir la app instalada (sin barra de navegador)
- [ ] Probar cotización + link corto WA sigue OK

### Forzar ver el service worker nuevo
Chrome → candado / sitio → “Borrar datos” del sitio, o ventana incógnito.

---

## Mensaje de venta (10 s)

> “No tiene que descargar nada de la tienda. Entra a tallerlink.netlify.app, toca **Instalar app**, y le queda el icono en el teléfono como WhatsApp.”

---

## Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿Ya es una app? | Sí, web app en producción |
| ¿Cómo se siente nativa ya? | **PWA** (instalar en pantalla de inicio) |
| ¿Play Store? | Capacitor + Android Studio |
| ¿App Store? | Capacitor + Xcode + cuenta Apple |
| ¿Reescribir todo? | No hace falta ahora |

**Siguiente paso inmediato:** pushear este código y decirles a los talleres “Instalar app” desde el botón de TallerLink.
