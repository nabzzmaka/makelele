import {
  QUALITY_DIMENSIONS,
  SCORE_LABELS,
  type EngagementScore,
  type Engagement,
  type ScoreFlag,
  type QualityDimensionKey,
  type RiskLevel,
} from "./types";

// ──────────────────────────────────────────────
// Weighted Score Calculation
// ──────────────────────────────────────────────

export function calculateWeightedScore(scores: EngagementScore[]): number | null {
  if (scores.length === 0) return null;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const s of scores) {
    weightedSum += s.score * s.weight;
    totalWeight += s.weight;
  }

  if (totalWeight === 0) return null;

  // Normalise to 0-100 scale (scores are 1-5, so max weighted = 5 * totalWeight)
  return Math.round((weightedSum / (5 * totalWeight)) * 100);
}

// ──────────────────────────────────────────────
// Score Bracket
// ──────────────────────────────────────────────

export function getScoreBracket(score: number): string {
  if (score >= 85) return "Exemplary";
  if (score >= 70) return "Satisfactory";
  if (score >= 50) return "Needs Improvement";
  if (score >= 30) return "Significant Deficiency";
  return "Critical Deficiency";
}

export function getScoreBracketColour(score: number): string {
  if (score >= 85) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 70) return "text-blue-700 bg-blue-50 border-blue-200";
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  if (score >= 30) return "text-orange-700 bg-orange-50 border-orange-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export function getScoreBarColour(score: number): string {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-amber-400";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-600";
}

// ──────────────────────────────────────────────
// Automatic Flag Detection (Rules Engine)
// ──────────────────────────────────────────────

const RISK_NUMERIC: Record<RiskLevel, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  very_high: 4,
};

interface FlagCandidate {
  flag_type: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export function detectFlags(
  engagement: Engagement,
  scores: EngagementScore[]
): FlagCandidate[] {
  const flags: FlagCandidate[] = [];

  const ir = RISK_NUMERIC[engagement.inherent_risk];
  const cr = RISK_NUMERIC[engagement.control_risk];
  const rmm = RISK_NUMERIC[engagement.overall_rmm];
  const testing = RISK_NUMERIC[engagement.substantive_testing_extent];

  // Rule 1: High inherent risk but low substantive testing
  if (ir >= 3 && testing <= 1) {
    flags.push({
      flag_type: "risk_testing_mismatch",
      severity: "critical",
      message:
        "High or very high inherent risk assessed, but substantive testing extent is low. This indicates insufficient audit response to assessed risk (ISA 330).",
    });
  }

  // Rule 2: High RMM but low testing
  if (rmm >= 3 && testing <= 2) {
    flags.push({
      flag_type: "rmm_testing_mismatch",
      severity: "warning",
      message:
        "Risk of material misstatement is high, but substantive testing extent is only moderate or low. Consider whether procedures adequately address the assessed risk.",
    });
  }

  // Rule 3: Low control risk but high inherent risk without justification
  if (ir >= 3 && cr <= 1) {
    flags.push({
      flag_type: "control_reliance_concern",
      severity: "warning",
      message:
        "High inherent risk with low control risk suggests heavy reliance on internal controls. Ensure tests of controls are sufficient to support this assessment.",
    });
  }

  // Rule 4: RMM inconsistent with component risks
  const expectedRmm = Math.max(ir, cr);
  if (Math.abs(rmm - expectedRmm) >= 2) {
    flags.push({
      flag_type: "rmm_inconsistency",
      severity: "warning",
      message:
        "Overall RMM appears inconsistent with assessed inherent and control risk levels. The combined assessment should reflect the higher of the component risks.",
    });
  }

  // Score-based flags
  const scoreMap = new Map<string, number>();
  for (const s of scores) {
    scoreMap.set(s.dimension_key, s.score);
  }

  // Rule 5: Risk-response coherence scored low
  const rrc = scoreMap.get("risk_response_coherence");
  if (rrc !== undefined && rrc <= 2) {
    flags.push({
      flag_type: "low_risk_response",
      severity: "critical",
      message:
        "Risk-Response Coherence scored as " +
        SCORE_LABELS[rrc] +
        ". The link between assessed risks and planned procedures requires immediate attention.",
    });
  }

  // Rule 6: Documentation sufficiency scored low
  const ds = scoreMap.get("documentation_sufficiency");
  if (ds !== undefined && ds <= 2) {
    flags.push({
      flag_type: "low_documentation",
      severity: "critical",
      message:
        "Documentation Sufficiency scored as " +
        SCORE_LABELS[ds] +
        ". ISA 230 requires documentation sufficient for an experienced auditor to understand the work performed.",
    });
  }

  // Rule 7: Professional skepticism low while high risk
  const ps = scoreMap.get("professional_skepticism");
  if (ps !== undefined && ps <= 2 && ir >= 3) {
    flags.push({
      flag_type: "skepticism_risk_gap",
      severity: "critical",
      message:
        "Low professional skepticism score on a high-risk engagement. This is a common inspection finding — heightened risk requires heightened skepticism.",
    });
  }

  // Rule 8: Large score variance across dimensions
  const scoreValues = scores.map((s) => s.score);
  if (scoreValues.length >= 3) {
    const max = Math.max(...scoreValues);
    const min = Math.min(...scoreValues);
    if (max - min >= 3) {
      flags.push({
        flag_type: "score_variance",
        severity: "info",
        message:
          "Large variance detected between quality dimensions (range: " +
          min +
          " to " +
          max +
          "). This may indicate inconsistent quality across the engagement file.",
      });
    }
  }

  return flags;
}

// ──────────────────────────────────────────────
// Narrative Generation (Rule-based, explainable)
// ──────────────────────────────────────────────

export function generateNarrative(
  engagement: Engagement,
  scores: EngagementScore[],
  totalScore: number | null,
  flags: FlagCandidate[]
): string {
  if (totalScore === null || scores.length === 0) {
    return "No scores have been recorded for this engagement yet.";
  }

  const bracket = getScoreBracket(totalScore);

  const parts: string[] = [];

  // Opening
  parts.push(
    `This ${engagement.engagement_type.replace(/_/g, " ")} engagement for ${engagement.client_name} ` +
      `(FY ${engagement.financial_year_end}) received an overall quality score of ${totalScore}/100, ` +
      `classified as "${bracket}".`
  );

  // Dimension highlights
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  if (weakest && strongest && weakest.dimension_key !== strongest.dimension_key) {
    const weakLabel =
      QUALITY_DIMENSIONS.find((d) => d.key === weakest.dimension_key)?.label ??
      weakest.dimension_key;
    const strongLabel =
      QUALITY_DIMENSIONS.find((d) => d.key === strongest.dimension_key)?.label ??
      strongest.dimension_key;

    parts.push(
      `The strongest dimension is "${strongLabel}" (${strongest.score}/5), ` +
        `while "${weakLabel}" (${weakest.score}/5) requires the most attention.`
    );
  }

  // Risk context
  if (
    engagement.inherent_risk === "high" ||
    engagement.inherent_risk === "very_high"
  ) {
    parts.push(
      `Given the ${engagement.inherent_risk.replace(/_/g, " ")} inherent risk profile, ` +
        `particular attention should be paid to the adequacy of audit responses.`
    );
  }

  // Flags
  const criticalFlags = flags.filter((f) => f.severity === "critical");
  const warningFlags = flags.filter((f) => f.severity === "warning");

  if (criticalFlags.length > 0) {
    parts.push(
      `${criticalFlags.length} critical flag(s) detected that require immediate remediation.`
    );
  }
  if (warningFlags.length > 0) {
    parts.push(
      `${warningFlags.length} warning(s) identified for partner review.`
    );
  }

  // Closing recommendation
  if (totalScore < 50) {
    parts.push(
      "Recommendation: This engagement should be subject to an enhanced quality review " +
        "and the identified deficiencies should be remediated before sign-off."
    );
  } else if (totalScore < 70) {
    parts.push(
      "Recommendation: Address the flagged areas and consider additional review " +
        "procedures to strengthen audit quality."
    );
  } else if (totalScore < 85) {
    parts.push(
      "The engagement meets expected quality standards. Continue monitoring the flagged areas."
    );
  } else {
    parts.push(
      "The engagement demonstrates strong quality across all dimensions. " +
        "Consider this as a model for best practice sharing."
    );
  }

  return parts.join(" ");
}
