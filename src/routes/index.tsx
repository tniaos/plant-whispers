import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Camera, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Verdín — Cuidado de plantas con IA" },
      {
        name: "description",
        content:
          "Fotografía tu planta, recibe un diagnóstico al instante y sigue un plan de cuidados con recordatorios.",
      },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Verdín</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost">Iniciar sesión</Button>
          </Link>
          <Link to="/login">
            <Button>Empezar gratis</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-6 pt-12 pb-20 md:pt-24 md:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Diagnóstico con IA en segundos
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              Cuida tus plantas con la ayuda de un{" "}
              <span
                style={{
                  backgroundImage: "var(--gradient-leaf)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                botánico digital
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Sube una foto de la hoja, el tallo o la planta entera. Nuestra IA detecta el
              problema y te entrega un plan de cuidados con recordatorios.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="h-12 px-7 text-base">
                  Empezar a cuidar mis plantas
                </Button>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              {
                icon: Camera,
                title: "Toma una foto",
                desc: "Hoja amarilla, mancha extraña o tu planta favorita: la IA la analiza al instante.",
              },
              {
                icon: Sparkles,
                title: "Recibe diagnóstico",
                desc: "Identifica especie, problema y un plan de cuidados claro y accionable.",
              },
              {
                icon: Bell,
                title: "No olvides nada",
                desc: "Recordatorios automáticos para regar, fertilizar o mover tu planta.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Hecho con 🌱 para amantes de las plantas.
      </footer>
    </div>
  );
}
