import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Leaf, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/plants/$id/")({
  component: PlantDetail,
});

const healthLabel: Record<string, { label: string; tone: string }> = {
  healthy: { label: "Saludable", tone: "bg-success/15 text-success" },
  mild_issue: { label: "Atención", tone: "bg-warning/15 text-warning" },
  serious_issue: { label: "Urgente", tone: "bg-destructive/15 text-destructive" },
};

function PlantDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["plant", id],
    queryFn: async () => {
      const [{ data: plant, error: pe }, { data: records }, { data: reminders }] = await Promise.all([
        supabase.from("plants").select("*").eq("id", id).maybeSingle(),
        supabase.from("plant_records").select("*").eq("plant_id", id).order("created_at", { ascending: false }),
        supabase.from("plant_reminders").select("*").eq("plant_id", id).order("due_at"),
      ]);
      if (pe) throw pe;
      return { plant, records: records ?? [], reminders: reminders ?? [] };
    },
  });

  const toggleReminder = async (rid: string, completed: boolean) => {
    const { error } = await supabase
      .from("plant_reminders")
      .update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null })
      .eq("id", rid);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["plant", id] });
  };

  const deletePlant = async () => {
    if (!confirm("¿Eliminar esta planta y todo su historial?")) return;
    const { error } = await supabase.from("plants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Planta eliminada");
    navigate({ to: "/plants" });
  };

  if (isLoading) return <div className="text-muted-foreground">Cargando…</div>;
  if (!data?.plant) return <div>No encontrada</div>;
  const { plant, records, reminders } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link to="/plants" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Mis plantas
      </Link>

      <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
        <div className="aspect-square overflow-hidden rounded-3xl bg-secondary" style={{ boxShadow: "var(--shadow-soft)" }}>
          {plant.cover_image_url ? (
            <img src={plant.cover_image_url} alt={plant.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary/60">
              <Leaf className="h-16 w-16" />
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{plant.nickname || plant.name}</h1>
            {plant.species && <p className="text-muted-foreground">{plant.species}</p>}
            {plant.location && <p className="text-sm text-muted-foreground">📍 {plant.location}</p>}
          </div>
          {plant.notes && <p className="text-sm">{plant.notes}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link to="/plants/$id/analyze" params={{ id }}>
              <Button>
                <Camera className="mr-2 h-4 w-4" /> Analizar nueva foto
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={deletePlant} aria-label="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {reminders.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Próximos cuidados</h2>
          <div className="space-y-2">
            {reminders.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded-2xl border bg-card p-4 ${r.completed ? "opacity-60" : ""}`}
              >
                <div>
                  <p className={`font-medium ${r.completed ? "line-through" : ""}`}>{r.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.due_at), "dd MMM", { locale: es })} · prioridad {r.priority}
                  </p>
                </div>
                <Button
                  variant={r.completed ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleReminder(r.id, r.completed)}
                >
                  <Check className="mr-1 h-4 w-4" />
                  {r.completed ? "Hecho" : "Marcar"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Historial de diagnósticos</h2>
        {records.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">
            Aún no hay diagnósticos. Sube una foto para empezar.
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((r) => {
              const status = r.health_status ? healthLabel[r.health_status] : null;
              const diag = r.ai_diagnosis as any;
              return (
                <div key={r.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex gap-4">
                    <img src={r.image_url} alt="" className="h-24 w-24 rounded-xl object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        {status && <Badge className={status.tone}>{status.label}</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm">{r.summary}</p>
                      {diag?.species_guess && (
                        <p className="mt-1 text-xs text-muted-foreground">Especie: {diag.species_guess}</p>
                      )}
                    </div>
                  </div>
                  {diag?.detected_issues?.length > 0 && (
                    <div className="mt-3 space-y-1 border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground">PROBLEMAS DETECTADOS</p>
                      <ul className="list-disc pl-5 text-sm">
                        {diag.detected_issues.map((i: any, idx: number) => (
                          <li key={idx}>
                            {i.issue} <span className="text-xs text-muted-foreground">({i.confidence})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}