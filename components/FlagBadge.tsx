interface Props {
  severity: "info" | "warning" | "critical";
  message: string;
}

const severityStyles: Record<string, string> = {
  critical: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const severityIcons: Record<string, string> = {
  critical: "!!",
  warning: "!",
  info: "i",
};

export default function FlagBadge({ severity, message }: Props) {
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 rounded-md border text-sm ${severityStyles[severity]}`}
    >
      <span className="font-bold shrink-0 mt-0.5">
        {severityIcons[severity]}
      </span>
      <span>{message}</span>
    </div>
  );
}
