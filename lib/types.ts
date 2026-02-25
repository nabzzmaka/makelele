export const ISQM1_COMPONENTS = [
  "Governance and Leadership",
  "Relevant Ethical Requirements",
  "Acceptance and Continuance of Client Relationships and Specific Engagements",
  "Engagement Performance",
  "Resources",
  "Information and Communication",
  "Risk Assessment Process",
  "Monitoring and Remediation Process",
] as const;

export type ISQM1Component = (typeof ISQM1_COMPONENTS)[number];

export const ISQM1_COMPONENT_CODES: Record<ISQM1Component, string> = {
  "Governance and Leadership": "GL",
  "Relevant Ethical Requirements": "ER",
  "Acceptance and Continuance of Client Relationships and Specific Engagements": "AC",
  "Engagement Performance": "EP",
  Resources: "RE",
  "Information and Communication": "IC",
  "Risk Assessment Process": "RA",
  "Monitoring and Remediation Process": "MR",
};

export type DeficiencyNature = "root_cause" | "symptom";
export type DeficiencySeverity = "minor" | "significant" | "pervasive";
export type DeficiencyStatus = "open" | "in_progress" | "resolved";
export type RemediationStatus = "pending" | "in_progress" | "completed";

export interface Deficiency {
  id: number;
  title: string;
  description: string | null;
  component: ISQM1Component;
  nature: DeficiencyNature;
  severity: DeficiencySeverity;
  status: DeficiencyStatus;
  identified_by: string | null;
  identified_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface RemediationAction {
  id: number;
  deficiency_id: number;
  description: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_date: string | null;
  status: RemediationStatus;
  created_at: string;
}

export interface DeficiencyWithRemediation extends Deficiency {
  remediation_actions: RemediationAction[];
}

export interface DashboardStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  by_component: { component: string; count: number }[];
  by_severity: { severity: string; count: number }[];
  recent: Deficiency[];
}
