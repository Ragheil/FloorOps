import { Download, LayoutDashboard, LayoutTemplate, Map, PanelLeftClose, Rows3, Warehouse, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Floor Plan", path: "/floor-plan", icon: LayoutTemplate },
  { name: "Bays", path: "/bays", icon: Warehouse },
  { name: "Stations", path: "/stations", icon: Rows3 },
  { name: "Export", path: "/export", icon: Download },
];

function Sidebar({ open, onClose }) {
  const linkClassName = ({ isActive }) =>
    [
      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
      isActive
        ? "bg-accent text-white shadow-lg shadow-rose-200"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/80 bg-white px-5 py-6 shadow-2xl transition lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-display text-2xl font-bold text-ink">FloorOps</p>
            <p className="text-sm text-slate-500">Station assignment board</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-8 rounded-[1.75rem] bg-ink p-5 text-white">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <Map className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">FloorOps Map</p>
              <p className="text-sm text-slate-300">Live floor visibility</p>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-300">
            Keep supervisors aligned with a clean operational view of every bay, station, and seat assignment.
          </p>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.path} to={item.path} className={linkClassName} onClick={onClose}>
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <PanelLeftClose className="h-4 w-4 text-accent" />
            Presentation-ready layout
          </div>
          <p className="text-sm leading-6 text-slate-500">
            Designed for quick scanning, easy edits, and clean demo moments with leadership.
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
