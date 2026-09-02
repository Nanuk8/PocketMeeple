import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { PendingSyncBanner } from "@/components/PendingSyncBanner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ToolsOverlay } from "@/components/tools/ToolsOverlay";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
      },
      { title: "PocketMeeple" },
      {
        name: "description",
        content:
          "App de registro de puntajes de juegos de mesa. Guarda el historial y ve récords históricos de tu grupo de juego.",
      },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:title", content: "PocketMeeple" },
      {
        property: "og:description",
        content:
          "App de registro de puntajes de juegos de mesa. Guarda el historial y ve récords históricos de tu grupo de juego.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "PocketMeeple" },
      {
        name: "twitter:description",
        content:
          "App de registro de puntajes de juegos de mesa. Guarda el historial y ve récords históricos de tu grupo de juego.",
      },
      { property: "og:image", content: "/pwa-512x512.png" },
      { name: "twitter:image", content: "/pwa-512x512.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user && currentPath !== "/login") {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, currentPath, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-slate-800 animate-spin" />
      </div>
    );
  }

  // If not loading, not user, and we are not on login, we render nothing because we are redirecting
  if (!user && currentPath !== "/login") {
    return null;
  }

  return <>{children}</>;
}

function RootComponent() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      import("virtual:pwa-register")
        .then(({ registerSW }) => {
          registerSW({ immediate: true });
        })
        .catch(console.error);
    }
    
    // Auto dark mode detection
    if (typeof window !== "undefined") {
      const matcher = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      updateTheme(matcher);
      matcher.addEventListener('change', updateTheme);
      return () => matcher.removeEventListener('change', updateTheme);
    }
  }, []);

  return (
    <AuthProvider>
      <AuthGuard>
        <RootLayout />
      </AuthGuard>
    </AuthProvider>
  );
}

function RootLayout() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="flex flex-col min-h-screen">
      <PendingSyncBanner />
      <div className={`flex-1 ${isAuthenticated ? "pb-16" : ""}`}>
        <Outlet />
      </div>
      {isAuthenticated && (
        <>
          <footer className="py-6 px-4 flex justify-center pb-24">
            <div className="flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <span className="text-xs font-semibold text-slate-500">Powered by</span>
              <a
                href="https://boardgamegeek.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#ff5100] text-white text-[11px] font-black px-2 py-0.5 rounded-sm tracking-wide flex items-center shadow-sm"
              >
                BGG
              </a>
            </div>
          </footer>
          <BottomNav />
          <ToolsOverlay />
        </>
      )}
      <Toaster />
    </div>
  );
}
