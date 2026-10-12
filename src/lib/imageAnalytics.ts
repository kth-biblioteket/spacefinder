export type ImageAnalyticsRow = {
  event_type: string;
  payload: Record<string, unknown> | null;
  session_id: string | null;
};

export type ImageAudience = "web" | "kiosk";

export function imagePosition(index: number): number {
  return Math.max(0, Math.floor(index)) + 1;
}

export function summarizeImageAnalytics(rows: ImageAnalyticsRow[]) {
  const audiences: Record<ImageAudience, { changes: number; opens: number; sessions: Set<string> }> = {
    web: { changes: 0, opens: 0, sessions: new Set() },
    kiosk: { changes: 0, opens: 0, sessions: new Set() },
  };
  const spaces = new Map<string, {
    id: string;
    name: string;
    changes: number;
    opens: number;
    sessions: Set<string>;
    web: number;
    kiosk: number;
    positions: Map<number, number>;
  }>();

  for (const row of rows) {
    if (row.event_type !== "image_change" && row.event_type !== "image_viewer_open") continue;
    const payload = row.payload ?? {};
    const id = String(payload.space_id ?? "");
    if (!id) continue;
    const audience: ImageAudience = payload.kiosk === true ? "kiosk" : "web";
    const isChange = row.event_type === "image_change";
    const aggregate = audiences[audience];
    if (isChange) aggregate.changes += 1;
    else aggregate.opens += 1;
    if (row.session_id) aggregate.sessions.add(row.session_id);

    const item = spaces.get(id) ?? {
      id,
      name: String(payload.name ?? id),
      changes: 0,
      opens: 0,
      sessions: new Set<string>(),
      web: 0,
      kiosk: 0,
      positions: new Map<number, number>(),
    };
    item.name = String(payload.name ?? item.name);
    if (isChange) {
      item.changes += 1;
      item[audience] += 1;
      const position = Number(payload.image_position);
      if (Number.isInteger(position) && position > 0) {
        item.positions.set(position, (item.positions.get(position) ?? 0) + 1);
      }
    } else {
      item.opens += 1;
    }
    if (row.session_id) item.sessions.add(row.session_id);
    spaces.set(id, item);
  }

  return {
    total: {
      changes: audiences.web.changes + audiences.kiosk.changes,
      opens: audiences.web.opens + audiences.kiosk.opens,
      sessions: new Set([...audiences.web.sessions, ...audiences.kiosk.sessions]).size,
    },
    audiences: {
      web: { ...audiences.web, sessions: audiences.web.sessions.size },
      kiosk: { ...audiences.kiosk, sessions: audiences.kiosk.sessions.size },
    },
    spaces: [...spaces.values()]
      .map((item) => ({
        ...item,
        sessions: item.sessions.size,
        positions: [...item.positions.entries()]
          .map(([position, count]) => ({ position, count }))
          .sort((a, b) => b.count - a.count || a.position - b.position),
      }))
      .sort((a, b) => b.sessions - a.sessions || b.changes - a.changes || b.opens - a.opens),
  };
}