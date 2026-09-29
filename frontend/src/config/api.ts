function getBackendUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  url = url.trim().replace(/\/+$/, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}

function getWsUrl(): string {
  let url = process.env.NEXT_PUBLIC_WS_URL;
  if (url && url.trim().length > 0) {
    url = url.trim().replace(/\/+$/, "");
    if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      url = "wss://" + url;
    }
    return url;
  }
  const backend = getBackendUrl();
  return backend.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://");
}

export const BACKEND_URL = getBackendUrl();
export const WS_URL = getWsUrl();
