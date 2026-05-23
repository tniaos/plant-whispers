import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Upload, Sparkles, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadPlantPhoto } from "@/lib/upload";
import { quickDiagnose, saveQuickDiagnosis, type PlantDiagnosis } from "@/lib/plants.functions";

export const Route = createFileRoute("/_authenticated/diagnose")({
  component: DiagnosePage,
  head: () => ({ meta: [{ title: "Diagnóstico rápido — Verdín" }] }),
});

const healthLabel: Record<string, { label: string; tone: string }> = {
  healthy: { label: "Saludable", tone: "bg-success/15 text-success" },
  mild_issue: { label: "Atención", tone: "bg-warning/15 text-warning" },
  serious_issue: { label: "Urgente", tone: "bg-destructive/15 text-destructive" },
};

function DiagnosePage() {
  const navigate = useNavigate();
  const diagnose = useServerFn(quickDiagnose);
  const save = useServerFn(saveQuickDiagnosis);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ diagnosis: PlantDiagnosis; imageUrl: string } | null>(null);
  const [customName, setCustomName] = useState("");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Sube una foto primero");
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No autenticado");
      const imageUrl = await uploadPlantPhoto(file, u.user.id);
      const res = await diagnose({ data: { imageUrl, userNote: note || undefined } });
      setResult({ diagnosis: res.diagnosis, imageUrl });
      setCustomName(res.diagnosis.species_guess || "");
      toast.success("¡Diagnóstico listo!");
    } catch (err: any) {
      toast.error(err.message || "No se pudo analizar la foto");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await save({
        data: {
          imageUrl: result.imageUrl,
          userNote: note || undefined,
          name: customName || undefined,
          diagnosis: result.diagnosis,
        },
      });
      toast.success("Planta guardada 🌿");
      navigate({ to: "/plants/$id", params: { id: res.plantId } });
    } catch (err: any) {
      toast.error(err.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setNote("");
    setResult(null);
    setCustomName("");
  };

  const status = result ? healthLabel[result.diagnosis.health_status] : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/plants" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Mis plantas
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Diagnóstico rápido</h1>
      <p className="text-muted-foreground">
        Sube la foto de una hoja u otra parte de la planta — la IA identifica la especie y te dice
        qué cuidados darle.
      </p>

      {!result ? (
        <form
          onSubmit={handleAnalyze}
          className="mt-8 space-y-5 rounded-3xl border bg-card p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <div className="space-y-2">
            <Label>Foto de la hoja o planta</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-8 text-sm text-muted-foreground hover:bg-secondary">
              <Upload className="h-4 w-4" />
              {file ? file.name : "Subir imagen"}
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
            {preview && (
              <img src={preview} alt="" className="mt-3 max-h-64 w-full rounded-xl object-cover" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Síntomas o notas (opcional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Las hojas tienen manchas marrones en los bordes…"
              maxLength={1000}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando con IA…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Diagnosticar
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="overflow-hidden rounded-3xl border bg-card" style={{ boxShadow: "var(--shadow-soft)" }}>
            <img src={result.imageUrl} alt="" className="max-h-72 w-full object-cover" />
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Especie detectada</p>
                  <h2 className="text-2xl font-semibold">{result.diagnosis.species_guess}</h2>
                </div>
                {status && <Badge className={status.tone}>{status.label}</Badge>}
              </div>
              <p className="text-sm text-foreground/90">{result.diagnosis.summary}</p>

              {result.diagnosis.detected_issues.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Problemas detectados</h3>
                  <ul className="space-y-2">
                    {result.diagnosis.detected_issues.map((it, i) => (
                      <li key={i} className="rounded-xl bg-secondary/40 p-3 text-sm">
                        <div className="font-medium">{it.issue}</div>
                        {it.evidence && <div className="text-xs text-muted-foreground">{it.evidence}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.diagnosis.care_plan.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Plan de cuidados</h3>
                  <ul className="space-y-2">
                    {result.diagnosis.care_plan.map((step, i) => (
                      <li key={i} className="rounded-xl border bg-card p-3 text-sm">
                        <div className="font-medium">{step.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {step.frequency} · en {step.due_in_days} día{step.due_in_days === 1 ? "" : "s"}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
            <h3 className="text-base font-semibold">Guardar como nueva planta</h3>
            <p className="text-sm text-muted-foreground">Crea un registro para seguir su evolución.</p>
            <div className="mt-4 space-y-2">
              <Label htmlFor="plant-name">Nombre</Label>
              <Input
                id="plant-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Mi planta"
              />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Guardar planta
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
                <RotateCcw className="mr-2 h-4 w-4" /> Otra foto
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}