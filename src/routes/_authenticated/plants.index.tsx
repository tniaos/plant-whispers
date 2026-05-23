import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Leaf, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/plants/")({
  component: PlantsPage,
  head: () => ({ meta: [{ title: "Mis plantas — Verdín" }] }),
});

const healthLabel: Record<string, { label: string; tone: string }> = {
  healthy: { label: "Saludable", tone: "bg-success/15 text-success" },
  mild_issue: { label: "Atención", tone: "bg-warning/15 text-warning" },
  serious_issue: { label: "Urgente", tone: "bg-destructive/15 text-destructive" },
};

function PlantsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["plants-with-latest"],
    queryFn: async () => {
      const { data: plants, error } = await supabase
        .from("plants")
        .select("id, name, nickname, cover_image_url, location, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (plants ?? []).map((p) => p.id);
      let latest: Record<string, { health_status: string | null; summary: string | null; created_at: string }> = {};
      let reminderCount: Record<string, number> = {};
      if (ids.length) {
        const { data: records } = await supabase
          .from("plant_records")
          .select("plant_id, health_status, summary, created_at")
          .in("plant_id", ids)
          .order("created_at", { ascending: false });
        (records ?? []).forEach((r) => {
          if (!latest[r.plant_id]) latest[r.plant_id] = r;
        });

        const { data: rems } = await supabase
          .from("plant_reminders")
          .select("plant_id")
          .in("plant_id", ids)
          .eq("completed", false)
          .lte("due_at", new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString());
        (rems ?? []).forEach((r) => {
          reminderCount[r.plant_id] = (reminderCount[r.plant_id] || 0) + 1;
        });
      }
      return { plants: plants ?? [], latest, reminderCount };
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis plantas</h1>
          <p className="text-muted-foreground">Tu jardín y el estado de cada planta.</p>
        </div>
        <Link to="/plants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Añadir planta
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : !data || data.plants.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Leaf className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Aún no tienes plantas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Añade tu primera planta para empezar a analizar fotos y recibir cuidados.
          </p>
          <Link to="/plants/new" className="mt-6 inline-block">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Añadir mi primera planta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.plants.map((p) => {
            const last = data.latest[p.id];
            const reminders = data.reminderCount[p.id] || 0;
            const status = last?.health_status ? healthLabel[last.health_status] : null;
            return (
              <Link
                key={p.id}
                to="/plants/$id"
                params={{ id: p.id }}
                className="group overflow-hidden rounded-3xl border bg-card transition hover:-translate-y-1 hover:shadow-md"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={p.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary/60">
                      <Leaf className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{p.nickname || p.name}</h3>
                    {reminders > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                        <Bell className="h-3 w-3" /> {reminders}
                      </span>
                    )}
                  </div>
                  {p.location && (
                    <p className="text-xs text-muted-foreground">{p.location}</p>
                  )}
                  {status && (
                    <div className="flex items-center justify-between pt-1">
                      <Badge className={status.tone}>{status.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(last!.created_at), {
                          locale: es,
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}