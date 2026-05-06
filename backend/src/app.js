import cors from "cors";
import express from "express";
import morgan from "morgan";
import baysRoutes from "./routes/bays.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import exportRoutes from "./routes/export.routes.js";
import stationsRoutes from "./routes/stations.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: false,
  })
);
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "FloorOps Map API is running." });
});

app.use("/api/bays", baysRoutes);
app.use("/api/stations", stationsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export", exportRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(errorHandler);

export default app;
