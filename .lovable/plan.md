## Problema 1 — Botón "Añadir planta" no funciona

**Causa raíz:** en el enrutamiento plano de TanStack Router, los archivos `plants.tsx`, `plants.new.tsx`, `plants.$id.tsx` y `plants.$id.analyze.tsx` hacen que `plants.tsx` y `plants.$id.tsx` se conviertan en **layouts padre** de sus hermanos. Como ninguno renderiza `<Outlet />`, al navegar a `/plants/new` la URL cambia pero la pantalla sigue mostrando la lista de plantas (parece que el botón no hace nada).

**Solución:**
- Renombrar `_authenticated/plants.tsx` → `_authenticated/plants.index.tsx`
- Renombrar `_authenticated/plants.$id.tsx` → `_authenticated/plants.$id.index.tsx`

Así cada ruta queda como hoja independiente y `/plants/new`, `/plants/$id` y `/plants/$id/analyze` se renderizan correctamente.

## Problema 2 — Diagnóstico rápido de hoja (sin planta previa)

Hoy el diagnóstico exige crear primero una planta. Añadiré un flujo nuevo:

**Nueva ruta:** `/diagnose` (en `_authenticated/diagnose.tsx`)
- Subir foto de una hoja u otra parte de la planta.
- Campo opcional de nota (síntomas).
- Llama a una nueva server function `quickDiagnose` (variante de `analyzePlantPhoto` que **no exige `plantId`**): identifica especie, problema y plan de cuidados.
- Muestra el resultado en pantalla: especie detectada, estado, problemas, plan de cuidados.
- Botón **"Guardar como nueva planta"** → crea la planta con la especie detectada + el registro y los recordatorios asociados, y navega a su detalle.

**Cambios técnicos:**
- `src/lib/plants.functions.ts`: nueva `quickDiagnose` que reutiliza el mismo prompt/esquema pero devuelve solo el diagnóstico (sin tocar BD).
- `src/lib/plants.functions.ts`: nueva `saveQuickDiagnosis` que recibe el diagnóstico + imageUrl y crea `plants` + `plant_records` + `plant_reminders` en una sola operación.
- `_authenticated/plants.index.tsx`: añadir botón secundario "Diagnóstico rápido" junto a "Añadir planta".
- Landing (`index.tsx`): añadir CTA "Probar diagnóstico" que también lleva a `/diagnose` (tras login).

## Resumen del entregable
1. Renombrar 2 archivos de ruta para arreglar la navegación.
2. Nueva página `/diagnose` con análisis de hoja + opción de guardar como planta.
3. Nuevas server functions `quickDiagnose` y `saveQuickDiagnosis`.
4. Accesos directos al diagnóstico desde el listado de plantas.
