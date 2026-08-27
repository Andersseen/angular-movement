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
  template: string;
}
