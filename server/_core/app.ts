import type { Server } from "http";
import { createApiApp } from "./apiApp";
import { serveStatic, setupVite } from "./vite";

export { createApiApp };

export async function createFullApp(server: Server) {
  const app = createApiApp();

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return app;
}
