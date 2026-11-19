import { useEffect, useState } from "react";
import { readTextSchedule, stockholmTimestamp, textIsVisible, type SpaceTags } from "./textSchedule";

export function useTextSchedule(tags: SpaceTags) {
  const schedule = readTextSchedule(tags);
  const [now, setNow] = useState(() => Date.now());
  const boundaries = Object.values(schedule).map(stockholmTimestamp).filter((v): v is number => v !== null);
  const boundaryKey = boundaries.join(",");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const current = Date.now();
      setNow(current);
      clearTimeout(timer);
      const next = boundaries.filter((v) => v > current).sort((a, b) => a - b)[0];
      if (next !== undefined) timer = setTimeout(refresh, Math.min(next - current + 1, 2_147_483_647));
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", refresh); };
  // The key represents all schedule boundaries, including edited dates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundaryKey]);
  return { notice: textIsVisible(schedule, "notice", now), info: textIsVisible(schedule, "info", now) };
}