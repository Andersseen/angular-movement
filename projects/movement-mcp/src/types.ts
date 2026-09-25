export interface DirectiveInput {
  name: string;
  type: string | null;
  required: boolean;
  defaultValue?: string;
}

export interface DirectiveSnapshot {
  className: string;
  selector: string;
  exportAs: string | null;
  description: string | null;
  inputs: DirectiveInput[];
  outputs: string[];
  signals: string[];
  /** true = one-shot (plays once, ignores later input changes), false = reactive, null = undocumented */
  oneShot: boolean | null;
}

export interface ApiSnapshot {
  generatedAt: string;
  directives: DirectiveSnapshot[];
  presets: string[];
}

export interface DirectiveExample {
  className: string;
  selector: string;
  /** The narrow import to add — never `MOVEMENT_DIRECTIVES` for a single directive. */
  importStatement: string;
  /** What goes in the component's `imports` array. */
  imports: string[];
  template: string;
  /** Directive-specific usage notes (touch semantics, timing units). */
  notes: string[];
}

export interface Guideline {
  topic: string;
  rule: string;
  example?: string;
}
