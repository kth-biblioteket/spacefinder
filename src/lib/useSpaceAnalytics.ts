import { useCallback, useMemo } from "react";
import { track } from "@/lib/analytics";
import type { Space } from "@/lib/spaces";
import { imagePosition } from "@/lib/imageAnalytics";

/**
 * Stable analytics callbacks for a single SpaceCard. Centralises the event
 * shape so call sites don't have to remember the payload keys.
 */
export function useSpaceAnalytics(space: Pick<Space, "id" | "name">) {
  const { id, name } = space;

  const trackExpand = useCallback(() => {
    track("card_expand", { space_id: id, name });
  }, [id, name]);

  const trackMap = useCallback(() => {
    track("map_link_click", { space_id: id, name });
  }, [id, name]);

  const trackBooking = useCallback(
    (kind: "booking" | "group_booking" | "book_now") => {
      track("booking_link_click", { space_id: id, name, kind });
    },
    [id, name],
  );

  const trackSpaceLink = useCallback(
    (targetId: string) => {
      track("space_link_click", { source_id: id, target_id: targetId });
    },
    [id],
  );

  const trackImageChange = useCallback(
    (index: number, surface: "card" | "viewer", kiosk: boolean) => {
      track("image_change", {
        space_id: id,
        name,
        image_position: imagePosition(index),
        surface,
        kiosk,
      });
    },
    [id, name],
  );

  const trackImageViewerOpen = useCallback(
    (index: number) => {
      track("image_viewer_open", {
        space_id: id,
        name,
        image_position: imagePosition(index),
        surface: "viewer",
        kiosk: false,
      });
    },
    [id, name],
  );

  return useMemo(
    () => ({ trackExpand, trackMap, trackBooking, trackSpaceLink, trackImageChange, trackImageViewerOpen }),
    [trackExpand, trackMap, trackBooking, trackSpaceLink, trackImageChange, trackImageViewerOpen],
  );
}
