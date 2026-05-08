import { supabase } from "../config/supabase.js";

const buildError = (message, statusCode, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
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

export const exportStations = async (req, res) => {
  let query = supabase
    .from("stations")
    .select(
      `
      id,
      seat_label,
      pc_name,
      ip_address,
      agent_name,
      agent_id,
      status,
      notes,
      updated_at,
      sort_order,
      bay:bays (
        id,
        name,
        sort_order
      )
    `
    )
    .order("sort_order", { ascending: true })
    .order("seat_label", { ascending: true });

  query = applyStationFilters(query, req.query);

  const { data, error } = await query;

  if (error) {
    throw buildError("Failed to export stations.", 500, error.message);
  }

  const sorted = [...data].sort((a, b) => {
    const baySortDelta = (a.bay?.sort_order || 0) - (b.bay?.sort_order || 0);
    if (baySortDelta !== 0) {
      return baySortDelta;
    }

    const stationSortDelta = (a.sort_order || 0) - (b.sort_order || 0);
    if (stationSortDelta !== 0) {
      return stationSortDelta;
    }

    return a.seat_label.localeCompare(b.seat_label);
  });

  const rows = sorted.map((station) => ({
    id: station.id,
    bay: station.bay?.name || "Unassigned",
    seatLabel: station.seat_label,
    pcName: station.pc_name || "",
    ipAddress: station.ip_address || "",
    agentName: station.agent_name || "",
    agentId: station.agent_id || "",
    status: station.status,
    notes: station.notes || "",
    updatedAt: station.updated_at,
  }));

  res.json({ data: rows });
};
