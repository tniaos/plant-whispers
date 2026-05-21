import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadPlantPhoto } from "@/lib/upload";
import { analyzePlantPhoto } from "@/lib/plants.functions";

export const Route = createFileRoute("/_authenticated/plants/$id/analyze")({
  component: AnalyzePage,
  head: () => ({ meta: [{ title: "Analizar planta — Verdín" }] }),
});

function AnalyzePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const analyze = useServerFn(analyzePlantPhoto);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Sube una foto primero");
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("No autenticado");
      const imageUrl = await uploadPlantPhoto(file, u.user.id);
      await analyze({ data: { plantId: id, imageUrl, userNote: note || undefined } });
      toast.success("¡Diagnóstico listo!");
      navigate({ to: "/plants/$id", params: { id } });
    } catch (err: any) {
      toast.error(err.message || "No se pudo analizar la foto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/plants/$id" params={{ id }} className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Analizar planta</h1>
      <p className="text-muted-foreground">Sube una foto clara — hoja, tallo o planta entera.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-3xl border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
        <div className="space-y-2">
          <Label>Foto</Label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-8 text-sm text-muted-foreground hover:bg-secondary">
            <Upload className="h-4 w-4" />
            {file ? file.name : "Subir imagen"}
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
          {preview && <img src={preview} alt="" className="mt-3 max-h-64 w-full rounded-xl object-cover" />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">¿Qué notas? (opcional)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Las hojas se están poniendo amarillas en los bordes…"
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
              <Sparkles className="mr-2 h-4 w-4" /> Analizar
            </>
          )}
        </Button>
      </form>
    </div>
  );
}