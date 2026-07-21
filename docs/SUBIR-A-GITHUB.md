# Subir TallerLink a GitHub (si el repo ya existe o es nuevo)

## Opción A — Ya tenés el repo en GitHub y este código local

```bash
cd tallerlink
git remote add origin https://github.com/TU_USUARIO/tallerlink.git
# si ya existe remote:
# git remote set-url origin https://github.com/TU_USUARIO/tallerlink.git

git push -u origin main
```

## Opción B — Subir el ZIP desde la web de GitHub

1. GitHub → tu repo (o **New repository** vacío, sin README)
2. Si está vacío: **uploading an existing file**
3. Arrastrá **todo el contenido** de la carpeta `tallerlink/`  
   (los archivos de adentro, no hace falta la carpeta padre)
4. Commit: `Initial TallerLink upload`

## Opción C — Clonar y copiar

```bash
git clone https://github.com/TU_USUARIO/tallerlink.git
# copiá encima los archivos de este paquete
cd tallerlink
git add -A
git commit -m "TallerLink full product"
git push
```

## Archivos que DEBEN estar en GitHub

```
.env.example
.gitignore
404.html
LICENSE
README.md
_redirects
favicon.svg
index.html
package.json
robots.txt
netlify.toml
js/billing.js
netlify/functions/create-checkout.js
netlify/functions/create-portal.js
netlify/functions/decision.js
netlify/functions/stripe-webhook.js
netlify/functions/verify-session.js
docs/MANUAL-DUENO.md
docs/PLAN-COMPLETO.md
docs/STRIPE-SETUP.md
docs/SUSCRIPCIONES.md
docs/SUBIR-A-GITHUB.md
```

## Después del push → Netlify

1. app.netlify.com → Add site → Import from GitHub
2. Elegí `tallerlink`
3. Build command: (vacío / lo lee netlify.toml)
4. Publish directory: `.`
5. Functions: `netlify/functions` (automático por netlify.toml)
6. Deploy
