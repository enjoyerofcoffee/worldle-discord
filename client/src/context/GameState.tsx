import type { Country } from "@shared/types";
import { MAX_TRIES, getDailyCountry, getDailySeed } from "@shared/daily";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { getRandomCountry } from "../daily";
import type { Difficulty } from "../difficulty";
import { setGame } from "../errors";
import { preloadOutline } from "../outline";
import {
  loadGame,
  loadUnlimited,
  saveHistory,
  saveUnlimited,
  type Streak,
} from "../save";

export { MAX_TRIES };

type Status =
  | "normal"
  | "duplicate"
  | "error"
  | "finished_loss"
  | "finished_won";
export type History = {
  countryCode: string;
  percentage: number;
  arrow: number | null;
};

export type Mode = "daily" | "unlimited";

export type GameState = {
  mode: Mode;
  difficulty: Difficulty; // only used in unlimited mode
  guesses: number;
  daily: Country;
  history: History[];
  status: Status;
  streak: number;
  best: number;
};

type GameStateAction =
  | { type: "guess"; payload: History }
  | { type: "load"; payload: Streak & { history: History[] } }
  | { type: "streak"; payload: Streak }
  | { type: "new"; payload: Country }
  | {
      type: "difficulty";
      payload: { difficulty: Difficulty; country: Country };
    }
  | { type: "reveal" };

const GameStateContext = createContext<GameState | undefined>(undefined);
const GameStateDispatchContext = createContext<
  Dispatch<GameStateAction> | undefined
>(undefined);

const dashboardReducer = (
  state: GameState,
  action: GameStateAction,
): GameState => {
  switch (action.type) {
    case "new": {
      return {
        ...state,
        guesses: 0,
        daily: action.payload,
        history: [],
        status: "normal",
      };
    }
    case "difficulty": {
      return {
        ...state,
        difficulty: action.payload.difficulty,
        guesses: 0,
        daily: action.payload.country,
        history: [],
        status: "normal",
      };
    }
    case "reveal": {
      return { ...state, status: "finished_loss" };
    }
    case "load": {
      const { history, streak, best } = action.payload;
      const won = history.some((item) => item.countryCode === state.daily.code);
      const guesses = won ? history.length - 1 : history.length;

      return {
        ...state,
        guesses: guesses,
        history: history,
        status: won
          ? "finished_won"
          : guesses >= MAX_TRIES
            ? "finished_loss"
            : "normal",
        streak: streak,
        best: best,
      };
    }
    case "streak": {
      return { ...state, ...action.payload };
    }
    case "guess": {
      if (state.status === "finished_won" || state.status === "finished_loss") {
        return state;
      }

      if (action.payload.countryCode === state.daily.code) {
        const history = state.history.some(
          (country) => country.countryCode === state.daily.code,
        )
          ? [...state.history]
          : [...state.history, action.payload];

        // Shown straight away, the save confirms it afterwards anyways
        const streak = state.mode === "daily" ? state.streak + 1 : state.streak;

        return {
          ...state,
          history: history,
          status: "finished_won",
          streak: streak,
          best: Math.max(state.best, streak),
        };
      }

      if (
        state.history.some(
          (item) => item.countryCode === action.payload.countryCode,
        )
      ) {
        return { ...state, status: "duplicate" };
      }

      if (action.payload.countryCode === state.daily.code) {
        return {
          ...state,
          history: [...state.history, action.payload],
          status: "finished_won",
        };
      }

      const lost = state.guesses + 1 >= MAX_TRIES;

      return {
        ...state,
        guesses: state.guesses + 1,
        history: [...state.history, action.payload],
        status: lost ? "finished_loss" : "normal",
        streak: lost && state.mode === "daily" ? 0 : state.streak,
      };
    }
    default:
      return state;
  }
};

type GameStateProviderProps = {
  mode: Mode;
  children: ReactNode;
};
export const GameStateProvider = ({
  mode,
  children,
}: GameStateProviderProps) => {
  const isDaily = mode === "daily";
  const [seed] = useState(getDailySeed);
  const [state, dispatch] = useReducer(
    dashboardReducer,
    undefined,
    (): GameState =>
      (isDaily ? undefined : loadUnlimited()) ?? {
        mode: mode,
        difficulty: "easy",
        guesses: 0,
        daily: isDaily ? getDailyCountry(seed) : getRandomCountry("easy"),
        history: [],
        status: "normal",
        streak: 0,
        best: 0,
      },
  );
  // Unlimited games are never saved, so there is nothing to load
  const [loaded, setLoaded] = useState(!isDaily);

  const [firstCountry] = useState(state.daily);
  const [outlineLoaded, setOutlineLoaded] = useState(false);

  useEffect(() => {
    if (!isDaily) {
      return;
    }

    const load = async () => {
      const game = await loadGame(seed);
      dispatch({ type: "load", payload: game });
      setLoaded(true);
    };

    load();
  }, [isDaily, seed]);

  useEffect(() => {
    preloadOutline(firstCountry).then(() => setOutlineLoaded(true));
  }, [firstCountry]);

  useEffect(() => {
    if (!isDaily || !loaded) {
      return;
    }

    saveHistory(seed, state.history).then((streak) => {
      if (streak !== undefined) {
        dispatch({ type: "streak", payload: streak });
      }
    });
  }, [isDaily, loaded, seed, state.history]);

  useEffect(() => {
    if (!isDaily) saveUnlimited(state);
  }, [isDaily, state]);

  useEffect(() => {
    setGame(state);
  }, [state]);

  if (!loaded || !outlineLoaded) {
    return (
      <div className="flex h-dvh items-center justify-center gap-2">
        <span className="loading loading-spinner loading-lg" />
        Loading game...
      </div>
    );
  }

  return (
    <GameStateContext value={state}>
      <GameStateDispatchContext value={dispatch}>
        {children}
      </GameStateDispatchContext>
    </GameStateContext>
  );
};

export const useGameState = () => {
  const state = useContext(GameStateContext);

  if (!state) {
    throw new Error("useGameStateState must be inside GameStateProvider");
  }

  return state;
};

export const useGameStateDispatch = () => {
  const dispatch = useContext(GameStateDispatchContext);

  if (!dispatch) {
    throw new Error("useGameStateDispatch must be inside GameStateProvider");
  }

  return dispatch;
};
