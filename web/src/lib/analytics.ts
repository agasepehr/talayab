import { supabase } from "./supabase";

type AnalyticsEvent =
  | "product_view"
  | "contact_click"
  | "map_click"
  | "instagram_click"
  | "list_impression"
  | "store_page_view";

const VISITOR_KEY = "talayab_visitor_id";
const SESSION_KEY = "talayab_session_id";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return String(Date.now()) + "-" + Math.random().toString(36).slice(2);
}

function getPersistentId(key: string, storage: Storage) {
  let value = storage.getItem(key);

  if (!value) {
    value = createId();
    storage.setItem(key, value);
  }

  return value;
}

function getVisitorId() {
  if (typeof window === "undefined") return null;
  return getPersistentId(VISITOR_KEY, window.localStorage);
}

function getSessionId() {
  if (typeof window === "undefined") return null;
  return getPersistentId(SESSION_KEY, window.sessionStorage);
}

export async function trackEvent({
  eventType,
  shopId,
  productId,
  metadata,
}: {
  eventType: AnalyticsEvent;
  shopId: number;
  productId?: number | null;
  metadata?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") return;

  const visitorId = getVisitorId();
  const sessionId = getSessionId();

  if (!visitorId || !sessionId) return;

  const { error } = await supabase.from("analytics_events").insert({
    shop_id: shopId,
    product_id: productId ?? null,
    event_type: eventType,
    visitor_id: visitorId,
    session_id: sessionId,
    page_path: window.location.pathname,
    referrer: document.referrer || null,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("TALAYAB analytics error:", error.message);
  }
}
