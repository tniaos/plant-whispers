- PlantCare AI — Cuidado de plantas con análisis por IA

App web donde el usuario sube una foto de su planta (hoja, tallo, planta completa), una IA la analiza y devuelve un diagnóstico con recomendaciones de cuidado. Todo queda guardado por planta para llevar un historial.

## Flujo del usuario

1. Crea cuenta / inicia sesión (Google o email).
2. Registra una planta (nombre, apodo, foto inicial opcional).
3. En la ficha de la planta sube una foto del problema (hoja amarilla, manchas, tallo, etc.).
4. La IA responde con: especie probable, estado de salud, problema detectado (plaga, riego, luz, nutrientes), y un plan de cuidados accionable.
5. El diagnóstico queda guardado como un "registro" en el historial de esa planta, con la foto y la fecha.
6. La planta muestra su línea de tiempo: evolución, próximos cuidados y recordatorios sugeridos.

## Pantallas

- **Landing / Login** — explica la propuesta, botón "Empezar".
- **Mis plantas** — grilla de tarjetas con foto, nombre y último estado.
- **Detalle de planta** — datos, foto principal, historial de diagnósticos, botón "Analizar nueva foto".
- **Nuevo diagnóstico** — subir foto, comentario opcional, ver resultado de la IA y guardarlo.
- **Configuración / cuenta** — cerrar sesión.

## Stack técnico

- **Frontend**: TanStack Start + React + Tailwind (template actual).
- **Backend**: Lovable Cloud (auth, base de datos Postgres, storage para imágenes).
- **IA**: Lovable AI Gateway con `google/gemini-3-flash-preview` (modelo multimodal — recibe imagen + texto y devuelve diagnóstico estructurado vía tool calling).

## Modelo de datos

- `profiles` — datos básicos del usuario (id = auth.users.id).
- `plants` — `id`, `user_id`, `name`, `species` (opcional), `nickname`, `cover_image_url`, `created_at`.
- `plant_records` — `id`, `plant_id`, `image_url`, `user_note`, `ai_diagnosis` (jsonb: especie, salud, problema, cuidados, urgencia), `created_at`.
- Bucket de storage `plant-photos` (público para lectura, escritura solo del dueño).
- RLS estricta: cada usuario solo ve/modifica sus propias plantas y registros.

## Integración con IA

Server function `analyzePlantPhoto` que:

1. Recibe URL pública de la imagen subida + nota opcional.
2. Llama al gateway con el modelo Gemini multimodal y un *tool* `report_diagnosis` con schema:
  - `species_guess` (string)
  - `health_status` (`healthy` | `mild_issue` | `serious_issue`)
  - `detected_issues` (array de `{ issue, confidence, evidence }`)
  - `care_plan` (array de `{ action, frequency, priority }`)
  - `summary` (string corto para mostrar)
3. Valida la respuesta y la guarda en `plant_records.ai_diagnosis`.
4. Maneja errores 429 / 402 con mensaje claro al usuario.

## Rutas (TanStack Start)

```text
src/routes/
  index.tsx                       landing pública
  login.tsx                       auth
  _authenticated.tsx              guard de sesión
  _authenticated/plants.tsx       lista de plantas
  _authenticated/plants.$id.tsx   detalle + historial
  _authenticated/plants.new.tsx   crear planta
  _authenticated/plants.$id.analyze.tsx  subir foto y analizar
```

## Fases de implementación

1. **Base** — activar Lovable Cloud, auth Google + email, layout y rutas protegidas.
2. **Datos** — migraciones de `plants`, `plant_records`, bucket `plant-photos` con RLS.
3. **CRUD plantas** — crear, listar, ver detalle, subir foto de portada.
4. **IA** — server function de análisis + UI de subida con loading y resultado bonito.
5. **Historial** — timeline de registros por planta, marcar acciones como hechas.
6. **Pulido** — diseño, estados vacíos, errores, responsive.

## Pregunta antes de empezar

- ¿Quieres que la IA también sugiera **recordatorios automáticos** (ej. "regar en 3 días") visibles en la app, o por ahora solo el diagnóstico + plan de cuidados estático?
  Si, Seria ideal que tenga recordatorios
- ¿Login con **Google** o solo **email + contraseña** para empezar?
  Que Las dos opciones sean posibles
- ¿Tienes preferencia de **estilo visual** (minimalista verde/natural, oscuro moderno, ilustrado/amigable) o lo propongo yo?
  Verde claro e interfaz amigable y natural