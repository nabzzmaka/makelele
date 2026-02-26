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

// ─── Risk Scoring (Risikoscoring) ───────────────────────────────────────────

export const AVVIKSHENDELSE_OPTIONS = [
  "Intern kvalitetskontroll",
  "Resultater fra overvåkende kontroller",
  "Resultater fra temakontroller o.l. – på oppdragsnivå",
  "Indikator for systematisk risiko (siste tre år)",
  "Historikk fra tidligere interne kontroller og overvåkende kontroller (siste tre år)",
  "Tidligere forbedringstiltak",
  "Ekstern kvalitetskontroll, erstatningssaker, innrapportering, klager, o.l.",
  "Obligatoriske kurs",
  "Etterutdanningskrav",
  "Vurdering fra nærmeste leder (skal kvalitetssikres av regional tjenesteleder (normalt))",
  "Skjønnsmessig vurdering av leder QRM og leder for revisjon",
  "Andre",
] as const;

export type Avvikshendelse = (typeof AVVIKSHENDELSE_OPTIONS)[number];

export const AVVIKSKATEGORI_OPTIONS = [
  "Godkjent",
  "Behov for betydelig forbedring",
  "Ikke godkjent",
] as const;

export type Avvikskategori = (typeof AVVIKSKATEGORI_OPTIONS)[number];

export const AVVIKSKATEGORI_POENG: Record<Avvikskategori, number> = {
  "Godkjent": 0,
  "Behov for betydelig forbedring": 10,
  "Ikke godkjent": 20,
};

export type RiskProfile = "Lav" | "Medium" | "Høy" | "Svært høy";

export const RISK_PROFILES: RiskProfile[] = ["Lav", "Medium", "Høy", "Svært høy"];

export function getRiskProfile(score: number): RiskProfile {
  if (score < 10) return "Lav";
  if (score < 20) return "Medium";
  if (score < 35) return "Høy";
  return "Svært høy";
}

export const PROFIT_CENTER_OPTIONS = [
  "Øst CCH",
  "Midt-Nord CCH",
  "Vest CCH",
  "Sør CCH",
] as const;

export const LEADER_LEVEL_OPTIONS = [
  "Partner",
  "Direktør",
  "Lønnspartner",
] as const;

export interface Partner {
  id: number;
  partner_id: string;
  partner_name: string;
  profit_center: string;
  leader_level: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerWithScore extends Partner {
  total_risk_score: number;
  risk_profile: RiskProfile;
}

export interface RiskEvent {
  id: number;
  partner_id: number;
  avvikshendelse: string;
  avvikskategori: string;
  poeng: number;
  begrunnelse: string;
  created_at: string;
  created_by: string;
}

export interface RiskDashboardStats {
  total_partners: number;
  high_risk_count: number;
  average_score: number;
  highest_score: number;
  distribution: { profile: RiskProfile; count: number; percentage: number }[];
}
