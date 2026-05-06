import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Bays from "./pages/Bays";
import Dashboard from "./pages/Dashboard";
import FloorPlan from "./pages/FloorPlan";
import Stations from "./pages/Stations";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/floor-plan" element={<FloorPlan />} />
          <Route path="/bays" element={<Bays />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/export" element={<Stations viewMode="export" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
