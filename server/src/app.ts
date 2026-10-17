import express, { type Express } from "express";
import { loadConfig } from "./config.ts";
import { type Container, createContainer } from "./container.ts";
import { createRouter } from "./routes.ts";

export const createApp = (container: Container): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.use("/api", createRouter(container));

  return app;
};

export const app: Express = createApp(createContainer(loadConfig()));
