# Por qué el celular no veía lo del PC (y cómo queda ahora)

## Causa
Los datos del taller (carros, cotizaciones, cola) se guardaban en **localStorage**:
solo en ese navegador de ese dispositivo.

```
PC Chrome  →  datos A
Celular    →  datos B (vacío o demo)
```

No era un bug de la “app instalada”: **PWA y web comparten origen**, pero **PC ≠ celular**.

## Solución
Sincronización en la nube por **email de registro** del taller.

```
PC y celular con el mismo email
    → /.netlify/functions/shop-sync
    → mismos shop + ots
```

### Qué hace la app
1. Cada **Guardar** sube a la nube (debounce 0.6 s)
2. Al **abrir** y cada **15 s** baja si el servidor está más nuevo
3. Botón **↻ Sync** fuerza nube + aprobaciones del cliente
4. Al **registrarte** con un email que ya tiene datos, los carga

## Cómo usarlo bien

1. En el **PC**: registrate con `taller@tudominio.com`
2. Cargá carros / cotizaciones
3. En el **celular**: abrí tallerlink.netlify.app (o la PWA)
4. Registrate con el **mismo email**
5. Esperá 1–2 s o tocá **↻ Sync**
6. Deben aparecer los mismos vehículos

## Si no sincroniza

| Problema | Qué hacer |
|----------|-----------|
| Email distinto | Mismo email exacto en ambos |
| No hay deploy nuevo | Push + redeploy Netlify |
| blobs_unavailable | Build con `npm install` (ya en netlify.toml) |
| Datos solo en un lado | Sync en el que tiene datos, luego en el otro |
| Demo seed en celular | Tras sync con email real, pisan los demo |

## Borrar demo del celular
Si ves “Taller Demo” y no tus carros:
1. Mismo email que en el PC
2. ↻ Sync
3. O en el celular: borrar datos del sitio y volver a entrar con el email correcto

## Privacidad
Los datos van a Netlify Blobs asociados al email.  
Quien sepa el email no “entra” solo: hace falta usar la app y el flujo de registro en ese dispositivo; el email es la clave de sync (no es un login con contraseña todavía).

Próximo paso de seguridad (futuro): magic link / PIN por email.
