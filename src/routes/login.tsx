import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skull, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    navigate({ to: "/", replace: true });
    return null;
  }

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Error al conectar con Google.");
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (mode: "login" | "register") => {
    try {
      setLoading(true);
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Registro exitoso. ¡Bienvenido a PocketMeeple!");
        navigate({ to: "/", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Has iniciado sesión correctamente.");
        navigate({ to: "/", replace: true });
      }
    } catch (error: any) {
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("Email o contraseña incorrectos.");
      } else if (error.message?.includes("already registered")) {
        toast.error("Este email ya está registrado.");
      } else {
        toast.error(error.message || "Ha ocurrido un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-4 rounded-3xl shadow-md border border-slate-100 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-black text-3xl shadow-inner">
              P
            </div>
          </div>
        </div>

        <Card className="border border-slate-200 shadow-xl bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-extrabold text-slate-900">PocketMeeple</CardTitle>
            <CardDescription className="text-slate-500">Tu ludoteca y asistente de juegos de mesa.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Botón de Google */}
            <div className="mb-6">
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continuar con Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">O usa tu email</span>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-medium"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm font-medium"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAuth("login");
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="email-login" className="text-slate-700 font-medium">Correo electrónico</Label>
                    <Input
                      id="email-login"
                      type="email"
                      required
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password-login" className="text-slate-700 font-medium">Contraseña</Label>
                    <Input
                      id="password-login"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold mt-2 bg-violet-600 hover:bg-violet-700 text-white"
                    disabled={loading || googleLoading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Ingresar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAuth("register");
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="email-register" className="text-slate-700 font-medium">Correo electrónico</Label>
                    <Input
                      id="email-register"
                      type="email"
                      required
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password-register" className="text-slate-700 font-medium">Contraseña</Label>
                    <Input
                      id="password-register"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-500 h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold mt-2 bg-violet-600 hover:bg-violet-700 text-white"
                    disabled={loading || googleLoading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear cuenta"}
                  </Button>
                  <p className="text-center text-xs text-slate-400 mt-4 px-2">
                    Se te enviará un correo de confirmación para activar tu cuenta.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
