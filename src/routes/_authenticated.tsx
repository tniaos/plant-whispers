import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Leaf, LogOut, Sprout, Sparkles, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setReady(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/" });
  };

  if (!ready) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--gradient-dawn)" }}
      >
        <div className="glass flex items-center gap-3 rounded-full px-5 py-3 text-leaf">
          <Leaf className="h-4 w-4 animate-leaf-sway" /> Cargando tu jardín…
        </div>
      </div>
    );
  }

  const nav = [
    { to: "/plants", label: "Mis plantas", icon: Sprout },
    { to: "/diagnose", label: "Diagnóstico", icon: Sparkles },
    { to: "/plants/new", label: "Añadir planta", icon: PlusCircle },
  ] as const;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-dawn)" }}
    >
      {/* Ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--mint), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--sage), transparent)" }}
      />

      {/* Floating collapsible sidebar */}
      <aside
        className={`fixed left-4 top-4 bottom-4 z-30 flex flex-col rounded-3xl text-cream shadow-[var(--shadow-float)] transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[230px]"
        }`}
        style={{ background: "var(--gradient-forest)" }}
      >
        <Link to="/plants" className="flex items-center gap-2 px-4 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-mint text-forest">
            <Leaf className="h-4 w-4 animate-leaf-sway" />
          </span>
          {!collapsed && (
            <span className="font-display text-lg font-semibold tracking-tight">Verdín</span>
          )}
        </Link>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to === "/plants" && pathname.startsWith("/plants") && !pathname.includes("/new"));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                  active ? "bg-mint text-forest shadow-[var(--shadow-soft)]" : "text-cream/80 hover:bg-white/10 hover:text-cream"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-forest" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-cream/80 transition hover:bg-white/10 hover:text-cream"
            title={collapsed ? "Salir" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Salir</span>}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mt-2 flex w-full items-center justify-center rounded-2xl bg-white/10 px-3 py-2 text-cream/70 transition hover:bg-white/20"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <main
        className={`relative z-10 min-h-screen px-6 py-10 transition-all duration-300 md:px-10 ${
          collapsed ? "md:pl-[92px]" : "md:pl-[254px]"
        } pl-[88px]`}
      >
        <div className="mx-auto max-w-6xl animate-grow-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}