import { languageFromFileName, tokenize } from './highlight';

const join = (tokens: { text: string }[]) => tokens.map((t) => t.text).join('');

describe('tokenize', () => {
  it('is lossless: concatenated tokens equal the source', () => {
    const sources: [string, Parameters<typeof tokenize>[1]][] = [
      ["import { a } from 'x'; // hi\nconst b = `t ${1}`;", 'ts'],
      ['<div moveEnter="fade-up" [moveDuration]="300">@if (a) {x}</div><!-- c -->', 'html'],
      ['npx angular-movement-mcp init # comment', 'bash'],
      ['{ "a": true, // c\n "b": null }', 'json'],
      ['a { color: red; /* c */ }', 'css'],
      ['<script>alert(1)</script> & "unbalanced', 'ts'],
    ];
    for (const [source, language] of sources) {
      expect(join(tokenize(source, language))).toBe(source);
    }
  });

  it('classifies TypeScript keywords, strings, comments and decorators', () => {
    const tokens = tokenize("@Component({}) const a = 'x'; // c", 'ts');
    const byType = (type: string) => tokens.filter((t) => t.type === type).map((t) => t.text);
    expect(byType('attr')).toEqual(['@Component']);
    expect(byType('keyword')).toEqual(['const']);
    expect(byType('string')).toEqual(["'x'"]);
    expect(byType('comment')).toEqual(['// c']);
  });

  it('treats HTML tags, attributes and values as separate tokens', () => {
    const tokens = tokenize('<div moveEnter="fade-up">', 'html');
    expect(tokens.map((t) => [t.type, t.text])).toEqual([
      ['keyword', '<div'],
      ['plain', ' '],
      ['attr', 'moveEnter'],
      ['plain', '='],
      ['string', '"fade-up"'],
      ['plain', '>'],
    ]);
  });

  it('never produces markup: hostile text stays a plain string token', () => {
    const hostile = '<img src=x onerror=alert(1)>';
    expect(join(tokenize(hostile, 'text'))).toBe(hostile);
  });

  it('infers language from the file name', () => {
    expect(languageFromFileName('app.config.ts')).toBe('ts');
    expect(languageFromFileName('card.html')).toBe('html');
    expect(languageFromFileName('install')).toBe('text');
  });
});
