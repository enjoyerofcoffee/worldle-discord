import {
  useFloating,
  useFocus,
  useInteractions,
  useListNavigation,
  useRole,
} from "@floating-ui/react";
import { COUNTRIES } from "@shared/countries";
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGameState, useGameStateDispatch } from "../../context/GameState";
import { getArrow, getPercentage } from "../../utils";

export const CountryList = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  const dispatch = useGameStateDispatch();
  const { status, history, daily } = useGameState();
  const finished = status === "finished_won" || status === "finished_loss";

  const COUNTRY_NAMES = COUNTRIES.map((country) => country.name);

  const listRef = useRef<Array<HTMLElement | null>>([]);

  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => setIsOpen(open && !!search.length),
  });

  const listNavigation = useListNavigation(context, {
    listRef,
    activeIndex,
    loop: true,
    virtual: true,
    onNavigate: setActiveIndex,
  });

  const focus = useFocus(context);
  const role = useRole(context, { role: "listbox" });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [listNavigation, focus, role],
  );

  const countries = useMemo(() => {
    const query = search.toLocaleLowerCase();

    return COUNTRY_NAMES.filter((country) =>
      country.toLocaleLowerCase().includes(query),
    );
  }, [search]);

  useEffect(() => {
    if (!duplicate) {
      return;
    }

    const timeout = setTimeout(() => setDuplicate(false), 2000);

    return () => clearTimeout(timeout);
  }, [duplicate]);

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ) => {
    const value = e.currentTarget.value;

    setSearch(value);
    setActiveIndex(null);
    setIsOpen(value !== "");
  };

  const selected = countries.find(
    (country) => country.toLocaleLowerCase() === search.toLocaleLowerCase(),
  );

  const handleSelect = (index: number) => {
    setSearch(countries[index]);
    setActiveIndex(null);
    setIsOpen(false);
  };

  const handleSubmit = () => {
    if (finished || !search) {
      return;
    }

    if (!selected) {
      setShaking(true);
      return;
    }

    const countryName = selected.toLocaleLowerCase();
    const countryToSubmit = COUNTRIES.find(
      (country) => country.name.toLowerCase() === countryName,
    );

    if (!countryToSubmit) {
      return;
    }

    const isDuplicate = history.some(
      (guess) => guess.countryCode === countryToSubmit.code,
    );

    setDuplicate(isDuplicate);
    if (isDuplicate) {
      setShaking(true);
    }

    setSearch("");
    setActiveIndex(null);
    setIsOpen(false);
    dispatch({
      type: "guess",
      payload: {
        countryCode: countryToSubmit.code,
        percentage: getPercentage(countryToSubmit, daily),
        arrow: getArrow(countryToSubmit, daily),
      },
    });
  };

  const handleKeyDownInput = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (
      isOpen &&
      activeIndex !== null &&
      countries[activeIndex] &&
      countries[activeIndex] !== selected
    ) {
      handleSelect(activeIndex);
      return;
    }

    handleSubmit();
  };

  return (
    <div
      className={`flex flex-col flex-1 shrink-0 ${status === "finished_won" && "aura aura-glow"}`}
    >
      <div
        onAnimationEnd={() => setShaking(false)}
        className={`flex h-11 rounded-lg border bg-earth-100 p-1 overflow-hidden focus-within:ring-2 focus-within:ring-earth-400 ${shaking ? "animate-shake" : ""} ${
          duplicate
            ? "border-amber-400"
            : status === "finished_won"
              ? "border-emerald-600"
              : "border-earth-300"
        }`}
      >
        <input
          value={search}
          ref={refs.setReference}
          type="text"
          placeholder="France... United Kingdom..."
          disabled={finished}
          className="flex-1 min-w-0 px-3 bg-transparent outline-none placeholder:text-earth-500 disabled:cursor-not-allowed"
          {...getReferenceProps({
            onChange: handleSearchChange,
            onKeyDown: handleKeyDownInput,
          })}
        />
        <button
          type="button"
          className="px-4 rounded-md bg-earth-600 text-earth-50 text-sm font-semibold cursor-pointer hover:bg-earth-700 disabled:opacity-40 disabled:cursor-default"
          disabled={finished || !selected}
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleSubmit}
        >
          Guess
        </button>
      </div>
      {duplicate && (
        <label className="mt-2 px-4 text-sm text-earth-500" htmlFor="name">
          You have already guessed this country!
        </label>
      )}
      {isOpen && (
        <div className="absolute inset-x-0 top-13 bottom-2 flex flex-col pointer-events-none z-100">
          <div
            ref={refs.setFloating}
            className="min-h-0 bg-earth-50 border border-earth-300 rounded-lg shadow-lg shadow-earth-800/10 p-1 overflow-auto pointer-events-auto"
            {...getFloatingProps({
              onMouseDown: (event) => event.preventDefault(),
            })}
          >
            {countries.map((country, index) => (
              <div
                key={`${country}-${index}`}
                className={`hover:bg-earth-100 px-3 py-2 rounded-md cursor-pointer ${activeIndex === index && "bg-earth-100"}`}
                ref={(node) => {
                  listRef.current[index] = node;
                }}
                {...getItemProps({
                  onClick: () => handleSelect(index),
                })}
              >
                {country}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
