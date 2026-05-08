import { supabase } from "../config/supabase.js";

const buildError = (message, statusCode, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

export const getDashboardSummary = async (req, res) => {
  const { data, error } = await supabase.from("stations").select("status");

  if (error) {
    throw buildError("Failed to load dashboard summary.", 500, error.message);
  }

  const summary = {
    totalSeats: data.length,
    active: 0,
    vacant: 0,
    issue: 0,
    reserved: 0,
  };

  for (const station of data) {
    if (station.status === "Active") summary.active += 1;
    if (station.status === "Vacant") summary.vacant += 1;
    if (station.status === "Issue") summary.issue += 1;
    if (station.status === "Reserved") summary.reserved += 1;
  }

  res.json({ data: summary });
};
