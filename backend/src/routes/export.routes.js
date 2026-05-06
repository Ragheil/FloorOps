import { Router } from "express";
import { exportStations } from "../controllers/export.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/stations", asyncHandler(exportStations));

export default router;
