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

// ──────────────────────────────────────────────
// Audit Quality Score Model
// ──────────────────────────────────────────────

export const QUALITY_DIMENSIONS = [
  {
    key: "risk_response_coherence",
    label: "Risk-Response Coherence",
    description:
      "Alignment between assessed risks (IR, CR, RMM) and the nature, timing, and extent of planned and performed procedures.",
    default_weight: 25,
  },
  {
    key: "documentation_sufficiency",
    label: "Documentation Sufficiency",
    description:
      "Completeness and quality of audit documentation — sufficient for an experienced auditor to understand work performed.",
    default_weight: 20,
  },
  {
    key: "professional_skepticism",
    label: "Professional Skepticism",
    description:
      "Evidence of questioning mind, critical assessment of evidence, and appropriate response to contradictory information.",
    default_weight: 15,
  },
  {
    key: "isa_compliance",
    label: "ISA Compliance",
    description:
      "Compliance with specific ISA requirements including mandatory procedures, documentation, and reporting obligations.",
    default_weight: 20,
  },
  {
    key: "internal_consistency",
    label: "Internal Consistency",
    description:
      "Consistency across the audit file — risk assessment through to conclusion, including cross-referencing and logical flow.",
    default_weight: 20,
  },
] as const;

export type QualityDimensionKey = (typeof QUALITY_DIMENSIONS)[number]["key"];

export const SCORE_LABELS: Record<number, string> = {
  1: "Critical Deficiency",
  2: "Significant Deficiency",
  3: "Needs Improvement",
  4: "Satisfactory",
  5: "Exemplary",
};

export const SCORE_COLOURS: Record<number, string> = {
  1: "bg-red-600",
  2: "bg-orange-500",
  3: "bg-amber-400",
  4: "bg-blue-500",
  5: "bg-green-500",
};

export type EngagementType = "statutory_audit" | "voluntary_audit" | "review" | "agreed_upon_procedures" | "other";

export const ENGAGEMENT_TYPES: { value: EngagementType; label: string }[] = [
  { value: "statutory_audit", label: "Statutory Audit" },
  { value: "voluntary_audit", label: "Voluntary Audit" },
  { value: "review", label: "Review Engagement" },
  { value: "agreed_upon_procedures", label: "Agreed-Upon Procedures" },
  { value: "other", label: "Other" },
];

export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export const RISK_LEVELS: { value: RiskLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very High" },
];

export interface Engagement {
  id: number;
  client_name: string;
  engagement_type: EngagementType;
  financial_year_end: string;
  partner_name: string;
  office: string;
  inherent_risk: RiskLevel;
  control_risk: RiskLevel;
  overall_rmm: RiskLevel;
  substantive_testing_extent: RiskLevel;
  scored_by: string | null;
  scored_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface EngagementScore {
  id: number;
  engagement_id: number;
  dimension_key: QualityDimensionKey;
  score: number;
  weight: number;
  notes: string | null;
  created_at: string;
}

export interface ScoreFlag {
  id: number;
  engagement_id: number;
  flag_type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  created_at: string;
}

export interface EngagementWithScores extends Engagement {
  scores: EngagementScore[];
  flags: ScoreFlag[];
  total_weighted_score: number | null;
  narrative: string | null;
}

export interface QualityDashboardStats {
  total_engagements: number;
  avg_score: number | null;
  score_distribution: { bracket: string; count: number }[];
  by_partner: { partner_name: string; avg_score: number; count: number }[];
  by_office: { office: string; avg_score: number; count: number }[];
  by_dimension: { dimension_key: string; label: string; avg_score: number }[];
  recent_engagements: (Engagement & { total_weighted_score: number | null })[];
  heatmap_data: { dimension_key: string; partner_name: string; avg_score: number }[];
  flag_summary: { flag_type: string; count: number }[];
}
