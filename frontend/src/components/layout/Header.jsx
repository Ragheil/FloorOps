import { CalendarDays, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageMeta = {
  "/dashboard": {
    title: "Floor Dashboard",
    subtitle: "Visualize the full call center floor and update assignments in place.",
  },
  "/bays": {
    title: "Bay Management",
    subtitle: "Organize floor sections, sort their order, and keep the map structure clean.",
  },
  "/floor-plan": {
    title: "Operational Floor Plan",
    subtitle: "See the 65-PC image-inspired layout and update stations without losing the visual arrangement.",
  },
  "/stations": {
    title: "Station Directory",
    subtitle: "Search, filter, edit, and export every seat from a single workspace.",
  },
  "/export": {
    title: "Export Preview",
    subtitle: "Review the current seating list and download a polished CSV snapshot.",
  },
};

function Header({ onMenuClick }) {
  const location = useLocation();
  const meta = pageMeta[location.pathname] || pageMeta["/dashboard"];
  const currentDate = new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date());

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-ink">{meta.title}</p>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{meta.subtitle}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex">
          <div className="rounded-xl bg-accentSoft p-2 text-accent">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Today</p>
            <p className="text-sm font-semibold text-slate-900">{currentDate}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
