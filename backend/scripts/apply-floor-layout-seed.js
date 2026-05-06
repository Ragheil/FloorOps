import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const bays = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Bay 1",
    description: "Left-side vertical rail, PCs 01 to 07",
    sort_order: 1,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Bay 2",
    description: "Left-center front column, PCs 08 to 13",
    sort_order: 2,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Bay 3",
    description: "Left-center rear column, PCs 14 to 19",
    sort_order: 3,
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Bay 4",
    description: "Top horizontal run, PCs 20 to 29",
    sort_order: 4,
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Bay 5",
    description: "Upper middle row, PCs 30 to 38",
    sort_order: 5,
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    name: "Bay 6",
    description: "Lower middle row, PCs 39 to 47",
    sort_order: 6,
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    name: "Bay 7",
    description: "Upper bottom row, PCs 48 to 56",
    sort_order: 7,
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    name: "Bay 8",
    description: "Lower bottom row, PCs 57 to 65",
    sort_order: 8,
  },
];

const bayRanges = [
  { id: bays[0].id, number: 1, from: 1, to: 7 },
  { id: bays[1].id, number: 2, from: 8, to: 13 },
  { id: bays[2].id, number: 3, from: 14, to: 19 },
  { id: bays[3].id, number: 4, from: 20, to: 29 },
  { id: bays[4].id, number: 5, from: 30, to: 38 },
  { id: bays[5].id, number: 6, from: 39, to: 47 },
  { id: bays[6].id, number: 7, from: 48, to: 56 },
  { id: bays[7].id, number: 8, from: 57, to: 65 },
];

const getBayForPc = (pcNumber) => bayRanges.find((bay) => pcNumber >= bay.from && pcNumber <= bay.to);

const getStatus = (pcNumber) => {
  if ([11, 24, 37, 43, 61].includes(pcNumber)) return "Issue";
  if ([7, 19, 30, 45, 57, 65].includes(pcNumber)) return "Reserved";
  if (pcNumber % 2 === 0) return "Active";
  return "Vacant";
};

const getNotes = (pcNumber, status) => {
  if (status === "Issue" && pcNumber % 2 === 0) return "PC needs checking";
  if (status === "Issue") return "Headset issue";
  if (status === "Reserved") return "Reserved for trainee";
  return null;
};

const stations = Array.from({ length: 65 }, (_, index) => {
  const pcNumber = index + 1;
  const bay = getBayForPc(pcNumber);
  const padded = String(pcNumber).padStart(2, "0");
  const positionInBay = pcNumber - bay.from + 1;
  const status = getStatus(pcNumber);

  return {
    bay_id: bay.id,
    seat_label: `PC-${padded}`,
    pc_name: `FOPS-PC-${padded}`,
    ip_address: `10.10.${bay.number}.${positionInBay}`,
    agent_name: null,
    agent_id: null,
    status,
    notes: getNotes(pcNumber, status),
    sort_order: positionInBay,
  };
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
const backupDirectory = path.resolve(__dirname, "./backups");

const loadEnvFile = async () => {
  const envContents = await fs.readFile(envPath, "utf8");

  for (const line of envContents.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#") || !trimmedLine.includes("=")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

await loadEnvFile();

delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.ALL_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;
delete process.env.all_proxy;

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env.");
}

const restBaseUrl = `${supabaseUrl}/rest/v1`;

const request = async (method, pathWithQuery, body = null, prefer = "return=representation") => {
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  if (body !== null) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${restBaseUrl}/${pathWithQuery}`, {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const details = payload?.message || text || `${response.status} ${response.statusText}`;
    throw new Error(`${method} ${pathWithQuery} failed: ${details}`);
  }

  return payload;
};

const currentBays = await request("GET", "bays?select=*&order=sort_order.asc", null, null);
const currentStations = await request("GET", "stations?select=*&order=seat_label.asc", null, null);

await fs.mkdir(backupDirectory, { recursive: true });

const timestamp = `${Date.now()}`;
const backupPath = path.join(backupDirectory, `pre-65pc-layout-${timestamp}.json`);

await fs.writeFile(
  backupPath,
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      bays: currentBays ?? [],
      stations: currentStations ?? [],
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Backup written to ${backupPath}`);

await request("DELETE", "stations?id=not.is.null", null, "return=minimal");
await request("DELETE", "bays?id=not.is.null", null, "return=minimal");
const insertedBays = await request("POST", "bays", bays);
const insertedStations = await request("POST", "stations", stations);

console.log(`Applied 65-seat layout successfully: ${insertedBays.length} bays and ${insertedStations.length} stations.`);
