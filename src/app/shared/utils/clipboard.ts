/**
 * Copies `text` to the clipboard. Prefers the async Clipboard API and falls back to a transient
 * textarea + `execCommand('copy')` for insecure contexts or denied permissions.
 * Resolves `true` on success, `false` when both paths fail. Never throws.
 */
export async function copyToClipboard(doc: Document, text: string): Promise<boolean> {
  try {
    await doc.defaultView!.navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(doc, text);
  }
}

function legacyCopy(doc: Document, text: string): boolean {
  const active = doc.activeElement as HTMLElement | null;
  const area = doc.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  doc.body.appendChild(area);
  area.select();
  try {
    return doc.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
    active?.focus?.();
  }
}
