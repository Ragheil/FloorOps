import { supabase } from "../config/supabase.js";
import { broadcastFloorUpdate } from "../realtime/floorUpdates.js";

const buildError = (message, statusCode, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

export const getBays = async (req, res) => {
  const { data, error } = await supabase
    .from("bays")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw buildError("Failed to fetch bays.", 500, error.message);
  }

  res.json({ data });
};

export const createBay = async (req, res) => {
  const { name, description = "", sort_order = 0 } = req.body;

  if (!name || !name.trim()) {
    throw buildError("Bay name is required.", 400);
  }

  const payload = {
    name: name.trim(),
    description: description?.trim() || null,
    sort_order: Number(sort_order) || 0,
  };

  const { data, error } = await supabase
    .from("bays")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw buildError("Failed to create bay.", 500, error.message);
  }

  broadcastFloorUpdate({ entity: "bays", action: "created", id: data.id });
  res.status(201).json({ data });
};

export const updateBay = async (req, res) => {
  const { id } = req.params;
  const { name, description, sort_order } = req.body;

  if (name !== undefined && !String(name).trim()) {
    throw buildError("Bay name is required.", 400);
  }

  const updates = {};

  if (name !== undefined) {
    updates.name = String(name).trim();
  }

  if (description !== undefined) {
    updates.description = String(description).trim() || null;
  }

  if (sort_order !== undefined) {
    updates.sort_order = Number(sort_order) || 0;
  }

  const { data, error } = await supabase
    .from("bays")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error && error.code === "PGRST116") {
    throw buildError("Bay not found.", 404);
  }

  if (error) {
    throw buildError("Failed to update bay.", 500, error.message);
  }

  broadcastFloorUpdate({ entity: "bays", action: "updated", id: data.id });
  res.json({ data });
};

export const deleteBay = async (req, res) => {
  const { id } = req.params;

  const { count, error: countError } = await supabase
    .from("stations")
    .select("*", { count: "exact", head: true })
    .eq("bay_id", id);

  if (countError) {
    throw buildError("Failed to validate bay deletion.", 500, countError.message);
  }

  if (count > 0) {
    throw buildError("Bay cannot be deleted while stations are assigned to it.", 409);
  }

  const { data, error } = await supabase.from("bays").delete().eq("id", id).select("id").single();

  if (error && error.code === "PGRST116") {
    throw buildError("Bay not found.", 404);
  }

  if (error) {
    throw buildError("Failed to delete bay.", 500, error.message);
  }

  if (!data) {
    throw buildError("Bay not found.", 404);
  }

  broadcastFloorUpdate({ entity: "bays", action: "deleted", id: data.id });
  res.json({ message: "Bay deleted successfully." });
};
