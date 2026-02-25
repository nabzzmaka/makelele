import type { DeficiencyStatus, DeficiencySeverity, DeficiencyNature, RemediationStatus } from "@/lib/types";

type BadgeVariant =
  | { kind: "status"; value: DeficiencyStatus }
  | { kind: "severity"; value: DeficiencySeverity }
  | { kind: "nature"; value: DeficiencyNature }
  | { kind: "remediation"; value: RemediationStatus };

const STATUS_STYLES: Record<DeficiencyStatus, string> = {
  open: "bg-red-100 text-red-800 border-red-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_LABELS: Record<DeficiencyStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const SEVERITY_STYLES: Record<DeficiencySeverity, string> = {
  minor: "bg-sky-100 text-sky-800 border-sky-200",
  significant: "bg-orange-100 text-orange-800 border-orange-200",
  pervasive: "bg-red-100 text-red-800 border-red-200",
};

const SEVERITY_LABELS: Record<DeficiencySeverity, string> = {
  minor: "Minor",
  significant: "Significant",
  pervasive: "Pervasive",
};

const NATURE_STYLES: Record<DeficiencyNature, string> = {
  root_cause: "bg-purple-100 text-purple-800 border-purple-200",
  symptom: "bg-gray-100 text-gray-700 border-gray-200",
};

const NATURE_LABELS: Record<DeficiencyNature, string> = {
  root_cause: "Root Cause",
  symptom: "Symptom",
};

const REMEDIATION_STYLES: Record<RemediationStatus, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

const REMEDIATION_LABELS: Record<RemediationStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function StatusBadge(props: BadgeVariant) {
  let className = "";
  let label = "";

  if (props.kind === "status") {
    className = STATUS_STYLES[props.value];
    label = STATUS_LABELS[props.value];
  } else if (props.kind === "severity") {
    className = SEVERITY_STYLES[props.value];
    label = SEVERITY_LABELS[props.value];
  } else if (props.kind === "nature") {
    className = NATURE_STYLES[props.value];
    label = NATURE_LABELS[props.value];
  } else {
    className = REMEDIATION_STYLES[props.value];
    label = REMEDIATION_LABELS[props.value];
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}
    >
      {label}
    </span>
  );
}
