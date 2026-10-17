import type { Request, Response } from "express";
import { getUserId, sendError } from "../http/middleware.ts";
import { gameBody, gameQuery, playersQuery } from "../http/validation.ts";
import type { GameService } from "../services/GameService.ts";

export class GameController {
  readonly games: GameService;

  constructor(games: GameService) {
    this.games = games;
  }

  show = async (req: Request, res: Response) => {
    const { error, value } = gameQuery.validate(req.query);
    if (error) {
      sendError(res, 400, error.message);
      return;
    }

    res.send(await this.games.getGame(getUserId(res), value.seed));
  };

  save = async (req: Request, res: Response) => {
    const { error, value } = gameBody.validate(req.body);
    if (error) {
      sendError(res, 400, error.message);
      return;
    }

    const streak = await this.games.saveGame(getUserId(res), value.seed, value.history);
    res.send({ ok: true, ...streak });
  };

  players = async (req: Request, res: Response) => {
    const { error, value } = playersQuery.validate(req.query);
    if (error) {
      sendError(res, 400, error.message);
      return;
    }

    res.send({ players: await this.games.getPlayers(value.seed, value.ids) });
  };
}
