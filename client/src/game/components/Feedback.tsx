import { useRef, useState } from "react";
import { useGameState } from "../../context/GameState";
import { DISCORD_INVITE_URL, openLink } from "../../discord";
import { getFeedbackContext, sendFeedback } from "../../feedback";

const MAX_LENGTH = 500;

type Status = "idle" | "sending" | "sent" | "error";

export const Feedback = () => {
  const game = useGameState();
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const submit = async () => {
    setStatus("sending");
    const ok = await sendFeedback(message.trim(), getFeedbackContext(game));
    if (ok) {
      setMessage("");
    }
    setStatus(ok ? "sent" : "error");
  };

  return (
    <>
      <button
        type="button"
        aria-label="Send feedback"
        title="Send feedback"
        className="absolute top-3 right-2 flex items-center justify-center gap-1.5 h-9 min-w-9 px-2 rounded-lg border border-earth-300 bg-earth-100 text-earth-500 cursor-pointer hover:text-earth-800 animate-pop"
        onClick={() => {
          setStatus("idle");
          dialog.current?.showModal();
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M4 5h16v11H10l-6 4z" />
        </svg>
        <span className="hidden sm:inline text-sm font-semibold">Feedback</span>
      </button>

      <dialog
        ref={dialog}
        className="m-auto w-[calc(100%-1.5rem)] max-w-md p-4 rounded-lg border border-earth-300 bg-earth-50 text-earth-800 backdrop:bg-earth-800/40"
        onClick={(event) => {
          // Clicks on the backdrop land on the dialog itself
          if (event.target === dialog.current) {
            dialog.current.close();
          }
        }}
      >
        {status === "sent" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Thanks for the feedback!</p>
            <button
              type="button"
              className="h-11 rounded-lg bg-earth-600 text-earth-50 text-sm font-semibold cursor-pointer hover:bg-earth-700"
              onClick={() => dialog.current?.close()}
            >
              Close
            </button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div>
              <h2 className="text-sm font-semibold">Send feedback</h2>
              <p className="text-xs text-earth-500">
                Anonymous, your Discord account is not attached.
              </p>
              {DISCORD_INVITE_URL && (
                <p className="text-xs text-earth-500">
                  Want a reply?{" "}
                  <button
                    type="button"
                    className="font-semibold underline cursor-pointer hover:text-earth-800"
                    onClick={() => openLink(DISCORD_INVITE_URL)}
                  >
                    Join our Discord server
                  </button>
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <textarea
                autoFocus
                required
                rows={4}
                maxLength={MAX_LENGTH}
                value={message}
                placeholder="Bugs, ideas, anything..."
                className="w-full p-2 rounded-lg border border-earth-300 bg-white text-sm resize-none focus:outline-2 focus:outline-earth-600"
                onChange={(event) => setMessage(event.target.value)}
              />
              <span className="self-end text-xs tabular-nums text-earth-500">
                {message.length}/{MAX_LENGTH}
              </span>
            </div>
            {status === "error" && (
              <p className="text-xs font-semibold text-red-700">
                Could not send the feedback, try again.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 h-11 rounded-lg border border-earth-300 bg-earth-100 text-sm font-semibold cursor-pointer hover:bg-earth-200"
                onClick={() => dialog.current?.close()}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "sending" || !message.trim()}
                className="flex-1 h-11 rounded-lg bg-earth-600 text-earth-50 text-sm font-semibold cursor-pointer hover:bg-earth-700 disabled:opacity-50 disabled:cursor-default"
              >
                {status === "sending" ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
};
