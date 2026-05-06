import { useEffect, useRef } from "react";
import { apiBaseUrl } from "../api/client";

const UPDATE_DEBOUNCE_MS = 200;
const streamUrl = `${String(apiBaseUrl).replace(/\/$/, "")}/stations/stream`;

function useFloorUpdates({ onUpdate, paused = false }) {
  const onUpdateRef = useRef(onUpdate);
  const pausedRef = useRef(paused);
  const pendingUpdateRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    pausedRef.current = paused;

    if (!paused && pendingUpdateRef.current) {
      pendingUpdateRef.current = false;
      onUpdateRef.current?.();
    }
  }, [paused]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.EventSource === "undefined") {
      return undefined;
    }

    const scheduleUpdate = () => {
      if (pausedRef.current) {
        pendingUpdateRef.current = true;
        return;
      }

      if (timeoutRef.current) {
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        onUpdateRef.current?.();
      }, UPDATE_DEBOUNCE_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleUpdate();
      }
    };

    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener("floor-update", scheduleUpdate);
    window.addEventListener("focus", scheduleUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      eventSource.removeEventListener("floor-update", scheduleUpdate);
      eventSource.close();
      window.removeEventListener("focus", scheduleUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
}

export default useFloorUpdates;
