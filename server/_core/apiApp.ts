import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth";
import { registerChatRoutes } from "./chat";
import { registerStorageProxy } from "./storageProxy";
import { registerResumeRoutes } from "../resumeRoutes";
import { registerGmailRoutes } from "../gmailRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";

export function createApiApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerResumeRoutes(app);
  registerAuthRoutes(app);
  registerGmailRoutes(app);
  registerChatRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
