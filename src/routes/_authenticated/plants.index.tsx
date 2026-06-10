import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Leaf, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
    <div className="space-y-10">
      {/* Header — asymmetric */}
      <div className="glass relative overflow-hidden rounded-[2.25rem] p-8 shadow-[var(--shadow-soft)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--sage), transparent)" }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-mint/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-forest">
              <Leaf className="h-3 w-3 animate-leaf-sway" /> Tu jardín
            </span>
            <h1 className="mt-3 font-display text-4xl text-forest md:text-5xl">
              Mis plantas
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Cada hoja es una historia. Observa el estado, recibe diagnósticos y acompaña su crecimiento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/diagnose">
              <Button variant="outline" className="rounded-full border-leaf/40 bg-white/70 hover:bg-white">
                <Sparkles className="mr-2 h-4 w-4" /> Diagnóstico rápido
              </Button>
            </Link>
            <Link to="/plants/new">
              <Button
                className="rounded-full text-cream shadow-[var(--shadow-soft)] hover:translate-y-[-1px]"
                style={{ background: "var(--gradient-forest)" }}
              >
                <Plus className="mr-2 h-4 w-4" /> Añadir planta
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="glass rounded-3xl px-5 py-3 text-sm text-leaf w-fit">
          <Leaf className="mr-2 inline h-4 w-4 animate-leaf-sway" /> Recogiendo tu jardín…
        </div>
      ) : !data || data.plants.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-leaf/30 bg-card/80 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-cream shadow-[var(--shadow-glow)]" style={{ background: "var(--gradient-leaf)" }}>
            <Leaf className="h-7 w-7 animate-leaf-sway" />
          </div>
          <h2 className="mt-5 font-display text-2xl text-forest">Tu jardín espera</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Añade tu primera planta para empezar a analizar fotos y recibir cuidados.
          </p>
          <Link to="/plants/new" className="mt-6 inline-block">
            <Button className="rounded-full bg-forest text-cream hover:bg-forest/90">
              <Plus className="mr-2 h-4 w-4" /> Añadir mi primera planta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {data.plants.map((p, idx) => {
            const last = data.latest[p.id];
            const reminders = data.reminderCount[p.id] || 0;
            const status = last?.health_status ? healthLabel[last.health_status] : null;
            // Asymmetric: alternate large / small spans
            const span =
              idx % 5 === 0
                ? "lg:col-span-3"
                : idx % 5 === 1
                ? "lg:col-span-3"
                : idx % 5 === 2
                ? "lg:col-span-2"
                : idx % 5 === 3
                ? "lg:col-span-2"
                : "lg:col-span-2";
            return (
              <Link
                key={p.id}
                to="/plants/$id"
                params={{ id: p.id }}
                className={`group relative overflow-hidden rounded-[2rem] border border-white/40 bg-card transition hover:-translate-y-1.5 ${span}`}
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: "var(--gradient-canopy)" }}>
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-mint/80">
                      <Leaf className="h-14 w-14 animate-leaf-sway" />
                    </div>
                  )}
                  {/* Status floating chip */}
                  {status && (
                    <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur ${status.tone}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {status.label}
                    </span>
                  )}
                  {reminders > 0 && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-warning/90 px-2 py-1 text-[11px] font-medium text-white shadow-[var(--shadow-soft)]">
                      <Bell className="h-3 w-3" /> {reminders}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 p-5">
                  <h3 className="font-display text-xl text-forest">{p.nickname || p.name}</h3>
                  {p.location && (
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.location}</p>
                  )}
                  {last && (
                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                      <span>
                        Último análisis ·{" "}
                        {formatDistanceToNow(new Date(last.created_at), { locale: es, addSuffix: true })}
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