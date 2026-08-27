import React from "react";
import ReactDOM from "react-dom/client";
import V4App from "./V4App";

declare const __BUILD_VERSION__: string;

const VERSION_KEY = "skincare101-build-version";
const currentVersion = __BUILD_VERSION__;

try {
  const savedVersion = window.localStorage.getItem(VERSION_KEY);
  if (savedVersion && savedVersion !== currentVersion) {
    window.localStorage.setItem(VERSION_KEY, currentVersion);
    const url = new URL(window.location.href);
    url.searchParams.set("v", currentVersion.slice(0, 8));
    window.location.replace(url.toString());
  } else {
    window.localStorage.setItem(VERSION_KEY, currentVersion);
  }
} catch {
  // Storage can be unavailable in private browsing; the app should still render normally.
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <V4App />
  </React.StrictMode>
);
