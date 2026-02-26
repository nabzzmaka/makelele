import { getScoreBracket, getScoreBracketColour } from "@/lib/scoring";

interface Props {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

export default function ScoreGauge({ score, size = "md" }: Props) {
  if (score === null) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm italic">
        Not scored
      </div>
    );
  }

  const bracket = getScoreBracket(score);
  const colourClass = getScoreBracketColour(score);

  const sizes = {
    sm: { container: "w-14 h-14", text: "text-lg", label: "text-xs" },
    md: { container: "w-20 h-20", text: "text-2xl", label: "text-xs" },
    lg: { container: "w-28 h-28", text: "text-4xl", label: "text-sm" },
  };

  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${s.container} rounded-full border-2 ${colourClass} flex items-center justify-center`}
      >
        <span className={`${s.text} font-bold`}>{score}</span>
      </div>
      <span className={`${s.label} font-medium text-gray-600`}>{bracket}</span>
    </div>
  );
}
