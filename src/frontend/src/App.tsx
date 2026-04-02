import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, LogIn, Truck } from "lucide-react";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import Expenses from "./pages/Expenses";
import Parties from "./pages/Parties";
import Trips from "./pages/Trips";
import Vehicles from "./pages/Vehicles";

export type Page =
  | "dashboard"
  | "deals"
  | "trips"
  | "parties"
  | "vehicles"
  | "expenses";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const { identity, login, isInitializing, isLoggingIn } =
    useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary-foreground" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            Loading Sangwan Container Service...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full px-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-card">
            <Truck className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Sangwan Container Service
            </h1>
            <p className="text-muted-foreground text-sm">
              Transport business management for broker offices and fleet owners
            </p>
          </div>
          <div className="w-full bg-card border border-border rounded-xl p-6 shadow-card">
            <h2 className="font-semibold text-foreground mb-1">
              Sign In to Continue
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Access your dashboard, manage trips, deals, and vehicles.
            </p>
            <Button
              className="w-full"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                  in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" /> Sign In
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "deals":
        return <Deals />;
      case "trips":
        return <Trips />;
      case "parties":
        return <Parties />;
      case "vehicles":
        return <Vehicles />;
      case "expenses":
        return <Expenses />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in">{renderPage()}</div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
