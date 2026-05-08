import { Router } from "express";
import {
  createStation,
  deleteStation,
  getStationById,
  getStations,
  streamStationUpdates,
  updateStation,
} from "../controllers/stations.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/stream", streamStationUpdates);
router.get("/", asyncHandler(getStations));
router.get("/:id", asyncHandler(getStationById));
router.post("/", asyncHandler(createStation));
router.put("/:id", asyncHandler(updateStation));
router.delete("/:id", asyncHandler(deleteStation));

export default router;
