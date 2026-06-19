import { useEffect } from "react";

export function Analytics() {
  useEffect(() => {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

    if (!endpoint || !websiteId || document.querySelector("script[data-jobpa-analytics]")) {
      return;
    }

    const script = document.createElement("script");
    script.defer = true;
    script.dataset.jobpaAnalytics = "true";
    script.dataset.websiteId = websiteId;
    script.src = `${String(endpoint).replace(/\/+$/, "")}/umami`;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
