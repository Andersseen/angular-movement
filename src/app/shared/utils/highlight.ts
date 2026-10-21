/**
 * Tiny, dependency-free syntax tokenizer for the site's code blocks.
 *
 * It returns data (`{ type, text }[]`), never markup: `CodeBlock` renders each token through an
 * Angular template binding, so arbitrary source text can never be interpreted as HTML. Accuracy is
 * deliberately "good enough to read" — it is not a parser, and unknown input degrades to plain text.
 */
export type TokenType = 'plain' | 'keyword' | 'string' | 'comment' | 'attr';

export interface CodeToken {
  readonly type: TokenType;
  readonly text: string;
}

export type CodeLanguage = 'ts' | 'html' | 'bash' | 'json' | 'css' | 'text';

const TS_KEYWORDS = new Set(
  (
    'import export from const let var function class extends implements interface type enum new ' +
    'return if else for while of in as await async yield true false null undefined this readonly ' +
    'private protected public static default typeof void inject provide'
  ).split(' '),
);

type Rule = readonly [TokenType | ((match: string) => TokenType), RegExp];

const TS_RULES: readonly Rule[] = [
  ['comment', /^(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)/],
  ['string', /^(?:'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\[\s\S]|[^`\\])*`)/],
  ['attr', /^@[A-Za-z_]\w*/],
  [(m) => (TS_KEYWORDS.has(m) ? 'keyword' : 'plain'), /^[A-Za-z_$][\w$]*/],
];

const HTML_RULES: readonly Rule[] = [
  ['comment', /^<!--[\s\S]*?-->/],
  ['keyword', /^<\/?[A-Za-z][\w:-]*/],
  ['string', /^"[^"]*"|^'[^']*'/],
  ['attr', /^[A-Za-z_*#[(][\w.:()[\]*#@-]*(?==)/],
  ['keyword', /^@(?:if|else|for|switch|case|default|empty|defer|let)\b/],
];

const BASH_RULES: readonly Rule[] = [
  ['comment', /^#[^\n]*/],
  ['string', /^'[^']*'|^"(?:\\.|[^"\\])*"/],
  [
    (m) => (/^(?:npx|npm|pnpm|yarn|ng|node|git|cd|echo)$/.test(m) ? 'keyword' : 'plain'),
    /^[\w.-]+/,
  ],
];

const JSON_RULES: readonly Rule[] = [
  ['comment', /^\/\/[^\n]*/],
  ['string', /^"(?:\\.|[^"\\\n])*"/],
  ['keyword', /^(?:true|false|null)\b/],
];

const CSS_RULES: readonly Rule[] = [
  ['comment', /^\/\*[\s\S]*?\*\//],
  ['string', /^'[^']*'|^"[^"]*"/],
  ['attr', /^[a-z-]+(?=\s*:)/],
  ['keyword', /^@[a-z-]+/],
];

const RULES: Record<CodeLanguage, readonly Rule[]> = {
  ts: TS_RULES,
  html: HTML_RULES,
  bash: BASH_RULES,
  json: JSON_RULES,
  css: CSS_RULES,
  text: [],
};

/** Infers the language from a file name such as `app.config.ts` or `card.html`. */
export function languageFromFileName(name: string): CodeLanguage {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'ts':
    case 'js':
    case 'mjs':
      return 'ts';
    case 'html':
      return 'html';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash';
    case 'json':
      return 'json';
    case 'css':
    case 'scss':
      return 'css';
    default:
      return 'text';
  }
}

export function tokenize(source: string, language: CodeLanguage): CodeToken[] {
  const rules = RULES[language];
  const tokens: CodeToken[] = [];
  let plain = '';
  let rest = source;

  const flush = () => {
    if (plain) {
      tokens.push({ type: 'plain', text: plain });
      plain = '';
    }
  };

  while (rest.length > 0) {
    let matched = false;
    for (const [kind, pattern] of rules) {
      const match = pattern.exec(rest);
      if (match && match[0].length > 0) {
        const text = match[0];
        const type = typeof kind === 'function' ? kind(text) : kind;
        if (type === 'plain') {
          plain += text;
        } else {
          flush();
          tokens.push({ type, text });
        }
        rest = rest.slice(text.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      plain += rest[0];
      rest = rest.slice(1);
    }
  }
  flush();
  return tokens;
}
