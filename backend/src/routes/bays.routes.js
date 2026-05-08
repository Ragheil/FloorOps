import { Router } from "express";
import { createBay, deleteBay, getBays, updateBay } from "../controllers/bays.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getBays));
router.post("/", asyncHandler(createBay));
router.put("/:id", asyncHandler(updateBay));
router.delete("/:id", asyncHandler(deleteBay));

export default router;
