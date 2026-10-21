export type Classification = 'automatic' | 'partial' | 'manual' | 'keep-native';

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

export interface Finding {
  kind: 'trigger' | 'provider' | 'animation-builder' | 'unresolved-binding';
  classification: Classification;
  /** Trigger name for `trigger` findings. */
  name?: string;
  location: SourceLocation;
  /** Where the trigger is bound in a template. */
  usages: SourceLocation[];
  /** Concrete, human-readable reasons for the classification. */
  reasons: string[];
  /** Suggested Angular Movement replacement. Diagnostic only — never applied. */
  suggestion?: string;
}

export interface Report {
  root: string;
  filesScanned: number;
  summary: Record<Classification, number>;
  findings: Finding[];
}
