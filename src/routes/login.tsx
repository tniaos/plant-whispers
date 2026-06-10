import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — Verdín" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/plants" });
    });
  }, [navigate]);

  const translateAuthError = (message: string) => {
    const known: Record<string, string> = {
      "password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
      "password is known to be weak": "Esta contraseña es demasiado común y fácil de adivinar. Usa una más segura.",
      "invalid login credentials": "Email o contraseña incorrectos",
      "user already registered": "Este email ya está registrado",
      "email not confirmed": "Aún no has confirmado tu correo",
      "invalid format": "El formato del email no es válido",
      "an account already exists": "Ya existe una cuenta con este email",
      "signup requires a valid password": "Ingresa una contraseña válida",
      "unable to validate email address": "El email no es válido",
    };
    const lower = message.toLowerCase();
    for (const [key, val] of Object.entries(known)) {
      if (lower.includes(key)) return val;
    }
    const match = message.match(/at least (\d+)/i);
    if (match) return `La contraseña debe tener al menos ${match[1]} caracteres`;
    return message;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(translateAuthError(error.message));
    toast.success("¡Bienvenido de vuelta!");
    navigate({ to: "/plants" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/plants` },
    });
    setLoading(false);
    if (error) return toast.error(translateAuthError(error.message));
    toast.success("¡Cuenta creada! Bienvenido a Verdín");
    navigate({ to: "/plants" });
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/plants",
    });
    if (result.error) return toast.error("No se pudo iniciar sesión con Google");
    if (result.redirected) return;
    navigate({ to: "/plants" });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* LEFT — botanical immersive panel */}
      <div
        className="relative hidden overflow-hidden p-10 text-cream lg:flex lg:flex-col lg:justify-between"
        style={{ background: "var(--gradient-canopy)" }}
      >
        <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-mint text-forest">
            <Leaf className="h-4 w-4 animate-leaf-sway" />
          </span>
          <span className="font-display text-xl font-semibold">Verdín</span>
        </Link>

        {/* SVG composition */}
        <svg viewBox="0 0 500 600" className="pointer-events-none absolute inset-0 h-full w-full opacity-90" aria-hidden>
          <defs>
            <linearGradient id="lLeafA" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#B7E4C7" />
              <stop offset="100%" stopColor="#2D6A4F" />
            </linearGradient>
            <linearGradient id="lLeafB" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#74C69D" />
              <stop offset="100%" stopColor="#1B4332" />
            </linearGradient>
          </defs>
          <g className="animate-leaf-sway" style={{ transformOrigin: "250px 320px" }}>
            <path d="M250 360 C170 340 110 270 130 180 C220 200 290 270 250 360 Z" fill="url(#lLeafA)" />
            <path d="M250 350 C330 330 390 260 370 170 C280 190 210 260 250 350 Z" fill="url(#lLeafB)" />
            <path d="M250 290 C200 250 190 180 220 130 C265 160 280 220 250 290 Z" fill="url(#lLeafA)" opacity="0.95" />
            <path d="M250 280 C300 240 310 170 280 120 C235 150 220 210 250 280 Z" fill="url(#lLeafB)" opacity="0.95" />
          </g>
          <circle cx="120" cy="100" r="3" fill="#F8F9FA" opacity="0.8" />
          <circle cx="420" cy="160" r="2" fill="#F8F9FA" opacity="0.6" />
          <circle cx="380" cy="480" r="3" fill="#F8F9FA" opacity="0.7" />
        </svg>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl leading-tight">
            Un jardín que <em className="italic text-mint">respira contigo</em>.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-mint/85">
            Diagnóstico botánico instantáneo, recordatorios suaves y una biblioteca
            viva de tus plantas — todo en un solo lugar.
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-mint/70">
            <div className="flex -space-x-2">
              {["#74C69D", "#B7E4C7", "#2D6A4F"].map((c) => (
                <span key={c} className="h-7 w-7 rounded-full border-2 border-forest" style={{ background: c }} />
              ))}
            </div>
            12.000+ jardineros cuidan con Verdín
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div
        className="relative flex items-center justify-center px-6 py-10"
        style={{ background: "var(--gradient-dawn)" }}
      >
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-forest text-cream">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold">Verdín</span>
          </Link>

          <div className="glass rounded-[2rem] p-8 shadow-[var(--shadow-float)]">
            <h1 className="font-display text-3xl text-forest">Entra a tu jardín</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Guarda y cuida tus plantas con un botánico digital.
            </p>

            <Button
            type="button"
            variant="outline"
            className="mt-6 w-full rounded-full border-leaf/30 bg-white/70 hover:bg-white"
            onClick={handleGoogle}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Continuar con Google
            </Button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">o con email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-mint/40 p-1">
              <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full rounded-full bg-forest text-cream hover:bg-forest/90" disabled={loading}>
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Contraseña</Label>
                  <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full rounded-full bg-forest text-cream hover:bg-forest/90" disabled={loading}>
                  {loading ? "Creando…" : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}