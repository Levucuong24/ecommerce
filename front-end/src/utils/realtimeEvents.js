const CHANNEL_NAME = "ecommerce-live-updates";
const STORAGE_EVENT_KEY = "ecommerce-live-update-event";

export const DATA_EVENTS = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
  STORES: "stores",
  USERS: "users",
};

const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

export const emitDataChanged = (type, payload = {}) => {
  const event = {
    type,
    payload,
    timestamp: Date.now(),
  };

  channel?.postMessage(event);
  localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(event));
  localStorage.removeItem(STORAGE_EVENT_KEY);
};

export const subscribeDataChanged = (handler) => {
  const handleMessage = (event) => {
    handler(event.data);
  };

  const handleStorage = (event) => {
    if (event.key !== STORAGE_EVENT_KEY || !event.newValue) return;

    try {
      handler(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed cross-tab payloads.
    }
  };

  channel?.addEventListener("message", handleMessage);
  window.addEventListener("storage", handleStorage);

  return () => {
    channel?.removeEventListener("message", handleMessage);
    window.removeEventListener("storage", handleStorage);
  };
};
