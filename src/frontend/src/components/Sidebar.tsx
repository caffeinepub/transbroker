import { cn } from "@/lib/utils";
import {
  Handshake,
  LayoutDashboard,
  LogOut,
  Receipt,
  Route,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import type { Page } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "vehicles", label: "Fleet / Vehicles", icon: Truck },
  { id: "trips", label: "Trips", icon: Route },
  { id: "parties", label: "Parties / Clients", icon: Users },
  { id: "deals", label: "Broker Deals", icon: Handshake },
  { id: "expenses", label: "Expenses", icon: Receipt },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { clear, identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-4)}`
    : "";

  return (
    <aside
      className="flex flex-col w-[248px] min-w-[248px] h-full"
      style={{ background: "oklch(0.22 0.055 243)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: "oklch(0.30 0.06 243)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "oklch(0.52 0.12 243)" }}
        >
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-xs tracking-wider text-white leading-tight">
            SANGWAN CONTAINER
          </p>
          <p className="font-bold text-xs tracking-wider text-white leading-tight">
            SERVICE
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.65 0.04 243)" }}
          >
            Business Manager
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-ocid={`nav.${item.id}.link`}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                isActive ? "text-white" : "hover:bg-white/10",
              )}
              style={
                isActive
                  ? { background: "oklch(0.33 0.075 243)", color: "white" }
                  : { color: "oklch(0.75 0.03 243)" }
              }
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        className="px-3 pb-4 space-y-1 border-t pt-3"
        style={{ borderColor: "oklch(0.30 0.06 243)" }}
      >
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 text-left"
          style={{ color: "oklch(0.75 0.03 243)" }}
          data-ocid="nav.settings.link"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <div
          className="px-3 py-2 rounded-lg"
          style={{ background: "oklch(0.27 0.06 243)" }}
        >
          <p
            className="text-xs truncate"
            style={{ color: "oklch(0.65 0.04 243)" }}
          >
            {shortPrincipal}
          </p>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-2 mt-1 text-xs font-medium hover:text-white transition-colors"
            style={{ color: "oklch(0.70 0.04 243)" }}
            data-ocid="nav.logout.button"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
