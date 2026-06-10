import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Camera, Bell, Sparkles, Droplets, Sun, Calendar, ArrowUpRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "GreenMind — Cuidado de plantas con IA" },
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
    <div
      className="relative min-h-screen overflow-hidden text-foreground"
      style={{ background: "var(--gradient-dawn)" }}
    >
      {/* Floating ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl animate-float-slow"
        style={{ background: "radial-gradient(closest-side, var(--mint), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-[600px] w-[600px] rounded-full opacity-50 blur-3xl animate-float-slow"
        style={{ background: "radial-gradient(closest-side, var(--sage), transparent)", animationDelay: "-3s" }}
      />

      {/* Floating brand pill */}
      <div className="absolute left-6 top-6 z-20 md:left-10 md:top-8">
        <Link
          to="/"
          className="glass inline-flex items-center gap-2 rounded-full px-3 py-2 shadow-[var(--shadow-soft)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-cream" style={{ background: "var(--gradient-leaf)" }}>
            <Leaf className="h-4 w-4 animate-leaf-sway" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-forest">GreenMind</span>
        </Link>
      </div>

      {/* Floating top-right auth */}
      <div className="absolute right-6 top-6 z-20 flex items-center gap-2 md:right-10 md:top-8">
        <Link to="/login">
          <Button variant="ghost" className="rounded-full text-forest hover:bg-white/40">Entrar</Button>
        </Link>
        <Link to="/login">
          <Button className="rounded-full bg-forest text-cream shadow-[var(--shadow-soft)] hover:bg-forest/90">
            Empezar gratis <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* SPLIT HERO */}
      <section className="relative z-10 mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 items-center gap-10 px-6 pt-32 pb-20 md:grid-cols-12 md:px-12 md:pt-28">
        {/* LEFT — copy */}
        <div className="md:col-span-6 md:pr-6 animate-grow-in">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-leaf">
            <Sparkles className="h-3 w-3" /> Botánico de bolsillo
          </span>
          <h1 className="mt-6 font-display text-[2.7rem] leading-[1.02] text-forest md:text-[4.6rem]">
            Escucha lo que
            <br />
            <em className="italic font-normal" style={{
              backgroundImage: "var(--gradient-leaf)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}>
              tus plantas
            </em>{" "}
            te dicen.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/70">
            Una foto basta. GreenMind identifica la especie, detecta enfermedades y
            te prepara un ritual de cuidados con recordatorios suaves.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/login">
              <Button
                size="lg"
                className="h-14 rounded-full px-8 text-base shadow-[var(--shadow-glow)] hover:translate-y-[-2px]"
                style={{ background: "var(--gradient-forest)", color: "var(--cream)" }}
              >
                <Camera className="mr-2 h-5 w-5" /> Diagnosticar mi planta
              </Button>
            </Link>
            <div className="flex items-center gap-3 text-sm text-foreground/70">
              <div className="flex -space-x-2">
                {["#1B4332", "#2D6A4F", "#74C69D"].map((c) => (
                  <span key={c} className="h-7 w-7 rounded-full border-2 border-cream" style={{ background: c }} />
                ))}
              </div>
              <span>+12.000 jardines acompañados</span>
            </div>
          </div>

          {/* Inline stats */}
          <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
            {[
              { k: "98%", v: "precisión" },
              { k: "<3s", v: "diagnóstico" },
              { k: "+450", v: "especies" },
            ].map((s) => (
              <div key={s.v} className="glass rounded-2xl px-3 py-3 text-center">
                <div className="font-display text-2xl text-forest">{s.k}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — layered visual */}
        <div className="relative md:col-span-6 md:h-[640px]">
          {/* Main "plant portrait" panel */}
          <div
            className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-float)]"
            style={{ background: "var(--gradient-canopy)" }}
          >
            {/* Decorative SVG leaves */}
            <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full opacity-90" aria-hidden>
              <defs>
                <linearGradient id="leafA" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#B7E4C7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="leafB" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#74C69D" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1B4332" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Pot */}
              <path d="M140 430 Q200 470 260 430 L250 490 Q200 505 150 490 Z" fill="#F8F9FA" opacity="0.95" />
              <rect x="138" y="420" width="124" height="14" rx="6" fill="#F8F9FA" opacity="0.9" />
              {/* Stem */}
              <path d="M200 430 C198 360 202 300 200 230" stroke="#1B4332" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Leaves */}
              <g style={{ transformOrigin: "200px 280px" }} className="origin-center animate-leaf-sway">
                <path d="M200 300 C140 280 100 220 110 160 C170 170 220 220 200 300 Z" fill="url(#leafA)" />
                <path d="M200 290 C260 270 300 210 290 150 C230 160 180 210 200 290 Z" fill="url(#leafB)" />
                <path d="M200 250 C160 220 140 170 160 120 C200 140 220 190 200 250 Z" fill="url(#leafA)" opacity="0.95" />
                <path d="M200 240 C240 210 260 160 240 110 C200 130 180 180 200 240 Z" fill="url(#leafB)" opacity="0.95" />
                <path d="M200 200 C175 175 170 130 190 95 C215 115 220 160 200 200 Z" fill="url(#leafA)" />
              </g>
              {/* Dew drops */}
              <circle cx="170" cy="180" r="3" fill="#F8F9FA" opacity="0.8" />
              <circle cx="240" cy="220" r="2" fill="#F8F9FA" opacity="0.7" />
              <circle cx="210" cy="140" r="2.5" fill="#F8F9FA" opacity="0.85" />
            </svg>

            {/* Upload chip */}
            <div className="absolute left-5 top-5 glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-cream">
              <Camera className="h-3.5 w-3.5" /> foto-001.jpg
            </div>
            <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-[11px] font-medium text-forest">
              <span className="h-2 w-2 rounded-full bg-leaf animate-pulse" /> Análisis en vivo
            </div>
          </div>

          {/* Floating card — diagnosis */}
          <div
            className="absolute -left-2 top-10 w-[260px] rounded-3xl bg-card p-5 shadow-[var(--shadow-float)] md:-left-10 animate-float-slow"
            style={{ animationDelay: "-1s" }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-cream" style={{ background: "var(--gradient-leaf)" }}>
                <Activity className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Diagnóstico</div>
                <div className="font-display text-lg text-forest">Monstera deliciosa</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="rounded-full bg-success/15 px-2 py-0.5 font-medium text-success">Saludable</span>
              <span className="text-muted-foreground">hace 2s</span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-mint/60">
              <div className="h-full w-[88%] rounded-full" style={{ background: "var(--gradient-leaf)" }} />
            </div>
          </div>

          {/* Floating card — moisture */}
          <div
            className="absolute -right-2 top-44 w-[200px] rounded-3xl bg-card p-5 shadow-[var(--shadow-float)] md:-right-6 animate-float-slow"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-mint text-forest">
                <Droplets className="h-4 w-4" />
              </span>
              <span className="font-display text-2xl text-forest">62%</span>
            </div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">Humedad del sustrato</div>
            <div className="mt-3 flex h-12 items-end gap-1">
              {[40, 55, 48, 62, 70, 65, 62].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: "var(--gradient-leaf)" }} />
              ))}
            </div>
          </div>

          {/* Floating card — reminder */}
          <div
            className="absolute -bottom-2 left-6 w-[280px] rounded-3xl bg-card p-5 shadow-[var(--shadow-float)] md:bottom-8 md:left-2 animate-float-slow"
            style={{ animationDelay: "-2s" }}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-cream">
                <Bell className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-forest">Próximo riego</div>
                <div className="text-xs text-muted-foreground">Mañana, 8:30 — 120 ml</div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-leaf">
                  <Sun className="h-3 w-3" /> Luz indirecta brillante
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFSET FEATURE BAND */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-6 pb-32 md:px-12">
        <div className="grid gap-6 md:grid-cols-12">
          {[
            { icon: Camera, title: "Captura", desc: "Una foto de la hoja basta. La IA detecta especie y síntomas.", span: "md:col-span-5", tone: "bg-card" },
            { icon: Sparkles, title: "Diagnóstico", desc: "Identifica plagas, deficiencias y el plan de recuperación.", span: "md:col-span-4", tone: "" },
            { icon: Calendar, title: "Ritual", desc: "Recordatorios suaves de riego, abono y luz.", span: "md:col-span-3", tone: "bg-card" },
          ].map((f, i) => (
            <article
              key={f.title}
              className={`group relative overflow-hidden rounded-[2rem] p-7 transition hover:-translate-y-1 ${f.span}`}
              style={
                i === 1
                  ? { background: "var(--gradient-forest)", color: "var(--cream)", boxShadow: "var(--shadow-float)" }
                  : { background: "var(--cream)", boxShadow: "var(--shadow-soft)", border: "1px solid var(--border)" }
              }
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${i === 1 ? "bg-mint text-forest" : "bg-mint/70 text-forest"}`}
              >
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className={`mt-5 font-display text-2xl ${i === 1 ? "text-cream" : "text-forest"}`}>{f.title}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${i === 1 ? "text-mint/90" : "text-muted-foreground"}`}>{f.desc}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider opacity-70">
                0{i + 1} <span className="ml-1">/ 03</span>
              </span>
            </article>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/40 px-6 py-8 text-center text-xs text-muted-foreground md:px-12">
        Hecho con <span className="text-leaf">🌱</span> · GreenMind — un botánico digital
      </footer>
    </div>
  );
}
