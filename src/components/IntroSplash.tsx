"use client";

import * as React from "react";

const INTRO_LINES = [
  "Checking loan documents…",
  "Flagging inconsistencies…",
  "Making risk visible.",
];

const STORAGE_KEY = "chequeck_has_seen_intro";

type IntroSplashProps = {
  children: React.ReactNode;
};

export function IntroSplash({ children }: IntroSplashProps) {
  const [showIntro, setShowIntro] = React.useState(false);
  const [isHiding, setIsHiding] = React.useState(false);
  const [typedLength, setTypedLength] = React.useState(0);

  const joinedText = React.useMemo(() => INTRO_LINES.join("\n"), []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.sessionStorage.getItem(STORAGE_KEY) === "true";
    if (seen) {
      setShowIntro(false);
      return;
    }
    setShowIntro(true);
  }, []);

  React.useEffect(() => {
    if (!showIntro || isHiding) return;
    if (!joinedText.length) return;
    if (typedLength >= joinedText.length) return;

    const interval = window.setInterval(() => {
      setTypedLength((prev) => (prev >= joinedText.length ? prev : prev + 1));
    }, 40);

    return () => window.clearInterval(interval);
  }, [showIntro, isHiding, joinedText, typedLength]);

  const markSeen = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, "true");
    }
  }, []);

  const handleFinish = React.useCallback(() => {
    setIsHiding(true);
    markSeen();
    window.setTimeout(() => {
      setShowIntro(false);
    }, 250);
  }, [markSeen]);

  const handleSkip = () => {
    if (!showIntro) return;
    handleFinish();
  };

  React.useEffect(() => {
    if (!showIntro || isHiding) return;
    if (!joinedText.length) return;
    if (typedLength < joinedText.length) return;

    const timeout = window.setTimeout(() => {
      handleFinish();
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [showIntro, isHiding, joinedText, typedLength, handleFinish]);

  const renderedLines = React.useMemo(() => {
    const typed = joinedText.slice(0, typedLength);
    const parts = typed.split("\n");
    return INTRO_LINES.map((_, idx) => parts[idx] ?? "");
  }, [joinedText, typedLength]);

  const activeLineIndex = React.useMemo(() => {
    const typed = joinedText.slice(0, typedLength);
    const parts = typed.split("\n");
    const lastIndex = Math.min(parts.length - 1, INTRO_LINES.length - 1);
    return lastIndex < 0 ? 0 : lastIndex;
  }, [joinedText, typedLength]);

  return (
    <>
      {children}
      {showIntro && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-cream transition-opacity duration-300 ${
            isHiding ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-tan/40 bg-cream/95 px-6 py-6 shadow-lg">
            <div className="flex flex-col items-center gap-1">
              <span className="font-serif text-2xl font-semibold tracking-tight text-navy">
                chequeck
              </span>
              <span className="text-[0.7rem] font-sans uppercase tracking-[0.3em] text-dusty">
                Loan clause review
              </span>
            </div>

            <div className="mt-2 w-full space-y-1 text-sm text-navy/90 min-h-[3.6rem]">
              {renderedLines.map((line, idx) => (
                <p
                  key={idx}
                  className="min-h-[1.2rem] font-mono text-[0.85rem] text-navy"
                >
                  {line}
                  {idx === activeLineIndex &&
                    typedLength < joinedText.length && (
                      <span className="ml-0.5 inline-block h-[1em] w-[0.55ch] animate-pulse bg-navy/80 align-baseline" />
                    )}
                </p>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between w-full text-[0.75rem] text-dusty">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-dusty border-t-transparent" />
                <span>Preparing your checks…</span>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-full border border-dusty/50 px-3 py-1 text-[0.7rem] font-medium text-navy hover:bg-cream/80"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
