import { Router } from "express";
import type { Container } from "./container.ts";

export const createRouter = ({ authenticate, controllers }: Container): Router => {
  const { auth, stats, games, reports } = controllers;
  const router = Router();

  router.post("/token", auth.createToken);
  router.get("/stats", stats.show);
  router.post("/feedback", reports.feedback);
  router.post("/log", reports.log);

  router.get("/game", authenticate, games.show);
  router.post("/game", authenticate, games.save);
  router.get("/players", authenticate, games.players);

  return router;
};
