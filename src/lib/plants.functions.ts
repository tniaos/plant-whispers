import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DiagnosisSchema = z.object({
  species_guess: z.string(),
  health_status: z.enum(["healthy", "mild_issue", "serious_issue"]),
  summary: z.string(),
  detected_issues: z
    .array(
      z.object({
        issue: z.string(),
        confidence: z.enum(["low", "medium", "high"]).default("medium"),
        evidence: z.string().optional().default(""),
      })
    )
    .default([]),
  care_plan: z
    .array(
      z.object({
        action: z.string(),
        frequency: z.string(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        due_in_days: z.number().int().min(0).max(60).default(3),
      })
    )
    .default([]),
});

export type PlantDiagnosis = z.infer<typeof DiagnosisSchema>;

export const quickDiagnose = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageUrl: string; userNote?: string }) =>
    z
      .object({
        imageUrl: z.string().url(),
        userNote: z.string().max(1000).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurado");

    const systemPrompt = `Eres un experto botánico. Analiza la foto enviada (hoja, tallo o planta entera), identifica la especie con la mayor precisión posible y entrega un diagnóstico claro en ESPAÑOL. Devuelve SIEMPRE el resultado usando la función report_diagnosis.`;
    const userText = data.userNote
      ? `Nota del usuario: ${data.userNote}\n\nIdentifica la especie y analiza el estado.`
      : "Identifica la especie en la imagen y dime cómo cuidarla.";

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: data.imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_diagnosis",
              description: "Reporta el diagnóstico estructurado",
              parameters: {
                type: "object",
                properties: {
                  species_guess: { type: "string" },
                  health_status: { type: "string", enum: ["healthy", "mild_issue", "serious_issue"] },
                  summary: { type: "string" },
                  detected_issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        issue: { type: "string" },
                        confidence: { type: "string", enum: ["low", "medium", "high"] },
                        evidence: { type: "string" },
                      },
                      required: ["issue", "confidence", "evidence"],
                      additionalProperties: false,
                    },
                  },
                  care_plan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        frequency: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        due_in_days: { type: "integer", minimum: 0, maximum: 60 },
                      },
                      required: ["action", "frequency", "priority", "due_in_days"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["species_guess", "health_status", "summary", "detected_issues", "care_plan"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_diagnosis" } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) throw new Error("Demasiadas solicitudes. Intenta de nuevo.");
      if (aiRes.status === 401 || aiRes.status === 403) throw new Error("GEMINI_API_KEY inválida.");
      console.error("Gemini API error", aiRes.status, text);
      throw new Error("Falló el análisis con IA");
    }

    const payload = await aiRes.json();
    const argsRaw = payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsRaw) throw new Error("La IA no devolvió un diagnóstico válido");
    return { diagnosis: DiagnosisSchema.parse(JSON.parse(argsRaw)) };
  });

export const saveQuickDiagnosis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      imageUrl: string;
      userNote?: string;
      name?: string;
      diagnosis: PlantDiagnosis;
    }) =>
      z
        .object({
          imageUrl: z.string().url(),
          userNote: z.string().max(1000).optional(),
          name: z.string().max(120).optional(),
          diagnosis: DiagnosisSchema,
        })
        .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const plantName = (data.name?.trim() || data.diagnosis.species_guess || "Mi planta").slice(0, 120);

    const { data: plant, error: plantErr } = await supabase
      .from("plants")
      .insert({
        user_id: userId,
        name: plantName,
        species: data.diagnosis.species_guess || null,
        cover_image_url: data.imageUrl,
      })
      .select("id")
      .single();
    if (plantErr || !plant) throw new Error(plantErr?.message || "No se pudo crear la planta");

    const { data: record, error: recErr } = await supabase
      .from("plant_records")
      .insert({
        plant_id: plant.id,
        user_id: userId,
        image_url: data.imageUrl,
        user_note: data.userNote ?? null,
        ai_diagnosis: data.diagnosis,
        health_status: data.diagnosis.health_status,
        summary: data.diagnosis.summary,
      })
      .select("id")
      .single();
    if (recErr || !record) throw new Error(recErr?.message || "No se pudo guardar el diagnóstico");

    const now = Date.now();
    const reminders = data.diagnosis.care_plan.map((step) => ({
      plant_id: plant.id,
      user_id: userId,
      record_id: record.id,
      action: `${step.action} — ${step.frequency}`,
      priority: step.priority,
      due_at: new Date(now + step.due_in_days * 24 * 60 * 60 * 1000).toISOString(),
    }));
    if (reminders.length > 0) {
      const { error: remErr } = await supabase.from("plant_reminders").insert(reminders);
      if (remErr) console.error("Failed to insert reminders", remErr);
    }

    return { plantId: plant.id };
  });

export const analyzePlantPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plantId: string; imageUrl: string; userNote?: string }) =>
    z
      .object({
        plantId: z.string().uuid(),
        imageUrl: z.string().url(),
        userNote: z.string().max(1000).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY no configurado");

    // Confirm the plant belongs to user
    const { data: plant, error: plantErr } = await supabase
      .from("plants")
      .select("id, name")
      .eq("id", data.plantId)
      .maybeSingle();
    if (plantErr || !plant) throw new Error("Planta no encontrada");

    const systemPrompt = `Eres un experto en cuidado de plantas. Analiza la foto enviada por el usuario (hoja, tallo o planta completa) y produce un diagnóstico claro y accionable en ESPAÑOL. Sé honesto cuando la imagen no permita identificar algo con certeza. Devuelve SIEMPRE el resultado usando la función report_diagnosis.`;

    const userText = data.userNote
      ? `Nota del usuario: ${data.userNote}\n\nAnaliza la planta en la imagen.`
      : "Analiza la planta en la imagen y dime cómo cuidarla.";

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: data.imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_diagnosis",
              description: "Reporta el diagnóstico estructurado de la planta",
              parameters: {
                type: "object",
                properties: {
                  species_guess: { type: "string", description: "Especie probable" },
                  health_status: {
                    type: "string",
                    enum: ["healthy", "mild_issue", "serious_issue"],
                  },
                  summary: { type: "string", description: "Resumen corto del estado" },
                  detected_issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        issue: { type: "string" },
                        confidence: { type: "string", enum: ["low", "medium", "high"] },
                        evidence: { type: "string" },
                      },
                      required: ["issue", "confidence", "evidence"],
                      additionalProperties: false,
                    },
                  },
                  care_plan: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        frequency: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                        due_in_days: { type: "integer", minimum: 0, maximum: 60 },
                      },
                      required: ["action", "frequency", "priority", "due_in_days"],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  "species_guess",
                  "health_status",
                  "summary",
                  "detected_issues",
                  "care_plan",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_diagnosis" } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) {
        throw new Error("Demasiadas solicitudes. Intenta de nuevo en unos segundos.");
      }
      if (aiRes.status === 401 || aiRes.status === 403) {
        throw new Error("GEMINI_API_KEY inválida.");
      }
      console.error("Gemini API error", aiRes.status, text);
      throw new Error("Falló el análisis con IA");
    }

    const payload = await aiRes.json();
    const toolCall = payload.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) throw new Error("La IA no devolvió un diagnóstico válido");

    let parsed: PlantDiagnosis;
    try {
      parsed = DiagnosisSchema.parse(JSON.parse(argsRaw));
    } catch (e) {
      console.error("Schema parse error", e, argsRaw);
      throw new Error("Respuesta inesperada del modelo");
    }

    // Save record
    const { data: record, error: recErr } = await supabase
      .from("plant_records")
      .insert({
        plant_id: data.plantId,
        user_id: userId,
        image_url: data.imageUrl,
        user_note: data.userNote ?? null,
        ai_diagnosis: parsed,
        health_status: parsed.health_status,
        summary: parsed.summary,
      })
      .select("id")
      .single();
    if (recErr || !record) throw new Error(recErr?.message || "No se pudo guardar el registro");

    // Create reminders from care_plan
    const now = Date.now();
    const reminders = parsed.care_plan.map((step) => ({
      plant_id: data.plantId,
      user_id: userId,
      record_id: record.id,
      action: `${step.action} — ${step.frequency}`,
      priority: step.priority,
      due_at: new Date(now + step.due_in_days * 24 * 60 * 60 * 1000).toISOString(),
    }));
    if (reminders.length > 0) {
      const { error: remErr } = await supabase.from("plant_reminders").insert(reminders);
      if (remErr) console.error("Failed to insert reminders", remErr);
    }

    // Update plant cover if missing
    await supabase
      .from("plants")
      .update({ cover_image_url: data.imageUrl })
      .eq("id", data.plantId)
      .is("cover_image_url", null);

    return { recordId: record.id, diagnosis: parsed };
  });