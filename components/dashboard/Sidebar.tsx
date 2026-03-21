"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  BarChart2, 
  Search, 
  DollarSign, 
  Activity, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const navItems = [
  { icon: BarChart2, label: "Overview", href: "/dashboard" },
  { icon: Search, label: "Anomalies", href: "/dashboard#anomalies" },
  { icon: DollarSign, label: "Cost Explorer", href: "/dashboard#costs" },
  { icon: Activity, label: "Traces", href: "/dashboard#traces" },
];

const bottomNavItems = [
  { icon: HelpCircle, label: "Help Centre", href: "#", disabled: true },
  { icon: Settings, label: "Settings", href: "#", disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    if (collapsed) {
      document.documentElement.classList.add("sidebar-collapsed");
    } else {
      document.documentElement.classList.remove("sidebar-collapsed");
    }
    return () => document.documentElement.classList.remove("sidebar-collapsed");
  }, [collapsed]);

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" && !activeHash;
    }
    if (href.includes("#")) {
      const hash = href.split("#")[1];
      return activeHash === `#${hash}`;
    }
    return pathname === href;
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/connect", { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[#101010] border-r border-slate-800/60 z-40 transition-all duration-300 ${
          collapsed ? "w-[80px]" : "w-64"
        }`}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-6 h-20 mb-4">
          <Image
            src="/aegis-logo.avif"
            alt="Aegis"
            width={32}
            height={32}
            className="h-8 w-8 flex-shrink-0 rounded-lg object-contain"
          />
          {!collapsed && (
            <span className="text-lg font-display font-bold text-white whitespace-nowrap tracking-wide">
              Aegis
            </span>
          )}
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-4 space-y-1.5">
          <p className={`px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 ${collapsed ? "text-center" : ""}`}>
            {collapsed ? "•••" : "Menu"}
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  if (item.href.includes("#")) {
                    setActiveHash(`#${item.href.split("#")[1]}`);
                  } else if (item.href === "/dashboard") {
                    setActiveHash("");
                  }
                }}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 group ${
                  active
                    ? "text-white bg-slate-800/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/20"
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-aegis rounded-r-md" />
                )}
                <item.icon className={`flex-shrink-0 w-5 h-5 transition-colors ${active ? "text-aegis" : "text-slate-400 group-hover:text-slate-300"}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Nav */}
        <div className="px-4 py-6 space-y-1.5 border-t border-slate-800/50">
           {bottomNavItems.map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400/50 cursor-not-allowed group"
                title="Coming soon"
              >
                <item.icon className="flex-shrink-0 w-5 h-5" />
                {!collapsed && (
                  <span className="flex items-center gap-2">
                    {item.label}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-semibold">Soon</span>
                  </span>
                )}
              </span>
           ))}
           <button
             onClick={handleLogout}
             disabled={loggingOut}
             className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-aegis hover:text-aegis-300 disabled:opacity-50 transition-all duration-200 group mt-2"
           >
             <LogOut className="flex-shrink-0 w-5 h-5" />
             {!collapsed && <span>{loggingOut ? "Logging out…" : "Log out"}</span>}
           </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
           className="absolute -right-3 top-24 flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50 shadow-md"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-[#101010] border-t border-slate-800/60 h-16 px-2 safe-area-bottom">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (item.href.includes("#")) {
                  setActiveHash(`#${item.href.split("#")[1]}`);
                } else if (item.href === "/dashboard") {
                  setActiveHash("");
                }
              }}
              className={`flex flex-col items-center gap-1 transition-colors ${active ? "text-aegis" : "text-slate-400 hover:text-white"}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  );
}