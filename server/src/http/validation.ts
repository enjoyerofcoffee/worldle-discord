import Joi from "joi";
import { MAX_TRIES, isValidSeed } from "../../../shared/daily.ts";
import type { Guess } from "../services/GameService.ts";

const MAX_PLAYERS = 100;
const MAX_FEEDBACK_LENGTH = 500;
const MAX_LOG_LENGTH = 10_000;

const seed = Joi.number()
  .integer()
  .custom((value: number, helpers) =>
    isValidSeed(value) ? value : helpers.error("any.invalid"),
  )
  .required();

const guess = Joi.object<Guess>({
  countryCode: Joi.string().allow("").max(10).required(),
  percentage: Joi.number().required(),
  arrow: Joi.number().allow(null).default(null),
});

const userIds = Joi.string()
  .empty("")
  .default([])
  .custom((value: string, helpers) => {
    const ids = [...new Set(value.split(",").filter(Boolean))];
    return ids.length > MAX_PLAYERS ? helpers.error("any.invalid") : ids;
  })
  .messages({ "any.invalid": "Too many players" });

const message = (maxLength: number) =>
  Joi.string().trim().max(maxLength).required();

export const tokenBody = Joi.object<{ code: string }>({
  code: Joi.string().required(),
}).required();

export const gameQuery = Joi.object<{ seed: number }>({ seed }).required();

export const gameBody = Joi.object<{ seed: number; history: Guess[] }>({
  seed,
  history: Joi.array().items(guess).max(MAX_TRIES).required(),
}).required();

export const playersQuery = Joi.object<{ seed: number; ids: string[] }>({
  seed,
  ids: userIds,
}).required();

export const feedbackBody = Joi.object<{ message: string; context: unknown }>({
  message: message(MAX_FEEDBACK_LENGTH),
  context: Joi.any(),
}).required();

export const logBody = Joi.object<{
  message: string;
  stack: unknown;
  context: unknown;
}>({
  message: message(MAX_LOG_LENGTH),
  stack: Joi.any(),
  context: Joi.any(),
}).required();
