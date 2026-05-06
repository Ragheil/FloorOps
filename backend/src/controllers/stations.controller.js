import { supabase } from "../config/supabase.js";
import { broadcastFloorUpdate, registerFloorUpdatesStream } from "../realtime/floorUpdates.js";

const VALID_STATUSES = ["Active", "Vacant", "Issue", "Reserved"];

const buildError = (message, statusCode, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

const ensureValidStatus = (status) => {
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw buildError(`Status must be one of: ${VALID_STATUSES.join(", ")}.`, 400);
  }
};

const ensureBayExists = async (bayId) => {
  const { data, error } = await supabase
    .from("bays")
    .select("id")
    .eq("id", bayId)
    .single();

  if (error || !data) {
    throw buildError("Selected bay does not exist.", 400);
  }
};

const applyStationFilters = (query, params) => {
  const { search, status, bay_id: bayId } = params;

  if (status && status !== "All") {
    query.eq("status", status);
  }

  if (bayId && bayId !== "All") {
    query.eq("bay_id", bayId);
  }

  if (search) {
    const term = search.trim();
    if (term) {
      query.or(
        [
          `agent_name.ilike.%${term}%`,
          `agent_id.ilike.%${term}%`,
          `pc_name.ilike.%${term}%`,
          `ip_address.ilike.%${term}%`,
          `seat_label.ilike.%${term}%`,
        ].join(",")
      );
    }
  }

  return query;
};

const stationSelect = `
  *,
  bay:bays (
    id,
    name,
    description,
    sort_order
  )
`;

export const getStations = async (req, res) => {
  let query = supabase
    .from("stations")
    .select(stationSelect)
    .order("sort_order", { ascending: true })
    .order("seat_label", { ascending: true });

  query = applyStationFilters(query, req.query);

  const { data, error } = await query;

  if (error) {
    throw buildError("Failed to fetch stations.", 500, error.message);
  }

  res.json({ data });
};

export const streamStationUpdates = (req, res) => {
  registerFloorUpdatesStream(req, res);
};

export const getStationById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("stations")
    .select(stationSelect)
    .eq("id", id)
    .single();

  if (error && error.code === "PGRST116") {
    throw buildError("Station not found.", 404);
  }

  if (error) {
    throw buildError("Failed to fetch station.", 500, error.message);
  }

  res.json({ data });
};

export const createStation = async (req, res) => {
  const {
    bay_id: bayId,
    seat_label: seatLabel,
    pc_name: pcName = "",
    ip_address: ipAddress = "",
    agent_name: agentName = "",
    agent_id: agentId = "",
    status = "Vacant",
    notes = "",
    sort_order: sortOrder = 0,
  } = req.body;

  if (!bayId) {
    throw buildError("Bay is required.", 400);
  }

  if (!seatLabel || !String(seatLabel).trim()) {
    throw buildError("Seat label is required.", 400);
  }

  ensureValidStatus(status);
  await ensureBayExists(bayId);

  const payload = {
    bay_id: bayId,
    seat_label: String(seatLabel).trim(),
    pc_name: pcName?.trim() || null,
    ip_address: ipAddress?.trim() || null,
    agent_name: agentName?.trim() || null,
    agent_id: agentId?.trim() || null,
    status,
    notes: notes?.trim() || null,
    sort_order: Number(sortOrder) || 0,
  };

  const { data, error } = await supabase
    .from("stations")
    .insert(payload)
    .select(stationSelect)
    .single();

  if (error) {
    throw buildError("Failed to create station.", 500, error.message);
  }

  broadcastFloorUpdate({ entity: "stations", action: "created", id: data.id });
  res.status(201).json({ data });
};

export const updateStation = async (req, res) => {
  const { id } = req.params;
  const {
    bay_id: bayId,
    seat_label: seatLabel,
    pc_name: pcName,
    ip_address: ipAddress,
    agent_name: agentName,
    agent_id: agentId,
    status,
    notes,
    sort_order: sortOrder,
  } = req.body;

  if (seatLabel !== undefined && !String(seatLabel).trim()) {
    throw buildError("Seat label is required.", 400);
  }

  ensureValidStatus(status);

  if (bayId !== undefined) {
    await ensureBayExists(bayId);
  }

  const updates = {};

  if (bayId !== undefined) updates.bay_id = bayId;
  if (seatLabel !== undefined) updates.seat_label = String(seatLabel).trim();
  if (pcName !== undefined) updates.pc_name = pcName?.trim() || null;
  if (ipAddress !== undefined) updates.ip_address = ipAddress?.trim() || null;
  if (agentName !== undefined) updates.agent_name = agentName?.trim() || null;
  if (agentId !== undefined) updates.agent_id = agentId?.trim() || null;
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes?.trim() || null;
  if (sortOrder !== undefined) updates.sort_order = Number(sortOrder) || 0;

  const { data, error } = await supabase
    .from("stations")
    .update(updates)
    .eq("id", id)
    .select(stationSelect)
    .single();

  if (error && error.code === "PGRST116") {
    throw buildError("Station not found.", 404);
  }

  if (error) {
    throw buildError("Failed to update station.", 500, error.message);
  }

  broadcastFloorUpdate({ entity: "stations", action: "updated", id: data.id });
  res.json({ data });
};

export const deleteStation = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase.from("stations").delete().eq("id", id).select("id").single();

  if (error && error.code === "PGRST116") {
    throw buildError("Station not found.", 404);
  }

  if (error) {
    throw buildError("Failed to delete station.", 500, error.message);
  }

  if (!data) {
    throw buildError("Station not found.", 404);
  }

  broadcastFloorUpdate({ entity: "stations", action: "deleted", id: data.id });
  res.json({ message: "Station deleted successfully." });
};
