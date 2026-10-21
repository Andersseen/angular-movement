import type { Classification, Report } from './types.js';

const LABEL: Record<Classification, string> = {
  automatic: 'AUTOMATIC CANDIDATE',
  partial: 'PARTIAL',
  manual: 'MANUAL',
  'keep-native': 'KEEP NATIVE / CSS',
};

const ORDER: Classification[] = ['automatic', 'partial', 'manual', 'keep-native'];

export function formatText(report: Report): string {
  const lines: string[] = [];
  lines.push(`Angular Movement migration assessment (read-only)`);
  lines.push(`Scanned ${report.filesScanned} TypeScript files under ${report.root}`);
  lines.push('');
  lines.push(ORDER.map((c) => `${LABEL[c].toLowerCase()}: ${report.summary[c]}`).join('  |  '));
  for (const classification of ORDER) {
    const group = report.findings.filter((f) => f.classification === classification);
    if (group.length === 0) continue;
    lines.push('', `== ${LABEL[classification]} (${group.length}) ==`);
    for (const f of group) {
      const title = f.name ? `${f.kind} '${f.name}'` : f.kind;
      lines.push(`- ${title}  ${f.location.file}:${f.location.line}:${f.location.column}`);
      for (const reason of f.reasons) lines.push(`    why: ${reason}`);
      for (const usage of f.usages)
        lines.push(`    used: ${usage.file}:${usage.line}:${usage.column}`);
      if (f.suggestion) {
        for (const s of f.suggestion.split('\n')) lines.push(`    try: ${s}`);
      }
    }
  }
  if (report.findings.length === 0) lines.push('', 'No legacy @angular/animations usage found.');
  lines.push(
    '',
    'No files were modified. Suggestions are diagnostic only; review each before applying.',
  );
  return lines.join('\n');
}
