import type { RequestHandler, Response } from "express";
import type { AuthService } from "../services/AuthService.ts";

export const sendError = (res: Response, status: number, message: string) => {
  res.status(status).send({ error: message });
};

export const authenticate =
  (auth: AuthService): RequestHandler =>
  async (req, res, next) => {
    const token = /^Bearer (\S+)$/.exec(req.headers.authorization ?? "")?.[1];
    const userId = token && (await auth.getUserId(token));

    if (!userId) {
      res.set("WWW-Authenticate", "Bearer");
      sendError(res, 401, "Not logged in");
      return;
    }

    res.locals.userId = userId;
    next();
  };

export const getUserId = (res: Response): string => res.locals.userId;
