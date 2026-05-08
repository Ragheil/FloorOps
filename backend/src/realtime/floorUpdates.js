const clients = new Set();
const HEARTBEAT_INTERVAL_MS = 25000;

const formatEvent = (eventName, payload) => `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;

export const registerFloorUpdatesStream = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write(formatEvent("ready", { timestamp: Date.now() }));

  const client = {
    res,
    heartbeatId: setInterval(() => {
      if (!res.writableEnded) {
        res.write(formatEvent("ping", { timestamp: Date.now() }));
      }
    }, HEARTBEAT_INTERVAL_MS),
  };

  clients.add(client);

  req.on("close", () => {
    clearInterval(client.heartbeatId);
    clients.delete(client);

    if (!res.writableEnded) {
      res.end();
    }
  });
};

export const broadcastFloorUpdate = ({ entity, action, id } = {}) => {
  const payload = {
    entity: entity || "stations",
    action: action || "updated",
    id: id || null,
    timestamp: Date.now(),
  };

  for (const client of clients) {
    if (client.res.writableEnded) {
      clearInterval(client.heartbeatId);
      clients.delete(client);
      continue;
    }

    client.res.write(formatEvent("floor-update", payload));
  }
};
