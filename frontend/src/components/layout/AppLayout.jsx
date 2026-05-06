import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isFloorPlanPage = location.pathname === "/floor-plan";

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-[18.5rem]">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div
            className={`mx-auto rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-panel backdrop-blur sm:p-6 lg:p-8 ${
              isFloorPlanPage ? "max-w-[112rem]" : "max-w-7xl"
            }`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
