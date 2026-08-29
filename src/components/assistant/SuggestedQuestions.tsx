"use client";

const SUGGESTED_QUESTIONS = [
  "What should I learn next?",
  "Why was this course recommended?",
  "What skills am I missing?",
  "Explain machine learning simply.",
  "Give me a project based on my current skills.",
  "Create a study plan for this week.",
  "How am I progressing?",
  "What should I focus on next?",
] as const;

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export default function SuggestedQuestions({ onSelect, disabled = false }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-sans text-[12.5px] text-trail-muted text-center">
        Ask your personal learning mentor anything, or pick a question below.
      </p>
      <div
        className="flex flex-wrap gap-2 justify-center"
        role="list"
        aria-label="Suggested questions"
      >
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            role="listitem"
            onClick={() => onSelect(q)}
            disabled={disabled}
            className="rounded-full border border-trail-borderStrong px-3.5 py-1.5 font-sans text-[12.5px] text-trail-text transition-colors hover:bg-trail-surface2 hover:border-trail-amber focus:outline-none focus-visible:ring-2 focus-visible:ring-trail-amber disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
