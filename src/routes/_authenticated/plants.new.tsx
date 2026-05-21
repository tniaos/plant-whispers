import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadPlantPhoto } from "@/lib/upload";

export const Route = createFileRoute("/_authenticated/plants/new")({
  component: NewPlantPage,
  head: () => ({ meta: [{ title: "Nueva planta — Verdín" }] }),
});

function NewPlantPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("No autenticado");

      let coverUrl: string | null = null;
      if (file) coverUrl = await uploadPlantPhoto(file, user.id);

      const { data, error } = await supabase
        .from("plants")
        .insert({
          user_id: user.id,
          name,
          nickname: nickname || null,
          species: species || null,
          location: location || null,
          notes: notes || null,
          cover_image_url: coverUrl,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Planta añadida 🌿");
      navigate({ to: "/plants/$id", params: { id: data.id } });
    } catch (err: any) {
      toast.error(err.message || "No se pudo crear la planta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/plants" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Mis plantas
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Nueva planta</h1>
      <p className="text-muted-foreground">Cuéntanos un poco sobre ella.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-3xl border bg-card p-6"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Monstera de la sala" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nickname">Apodo</Label>
            <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Mostri" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="species">Especie</Label>
            <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Monstera deliciosa" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Junto a la ventana este" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="La compré el verano pasado…" />
        </div>

        <div className="space-y-2">
          <Label>Foto de portada (opcional)</Label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-6 text-sm text-muted-foreground hover:bg-secondary">
            <Upload className="h-4 w-4" />
            {file ? file.name : "Sube una imagen"}
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
          {preview && (
            <img src={preview} alt="preview" className="mt-3 max-h-48 rounded-xl object-cover" />
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || !name}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando…
            </>
          ) : (
            "Crear planta"
          )}
        </Button>
      </form>
    </div>
  );
}