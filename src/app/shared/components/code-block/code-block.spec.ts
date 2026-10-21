import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { CodeBlock } from './code-block';

const SOURCE = `<div moveEnter="fade-up">1 < 2 && "x"</div>`;

function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

describe('CodeBlock', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
    vi.restoreAllMocks();
  });

  it('renders source as text, never as markup', async () => {
    const { container } = await render(CodeBlock, {
      inputs: { code: '<img src=x onerror=alert(1)>', title: 'evil.html' },
    });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('copies the raw source, not highlighted markup', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await render(CodeBlock, { inputs: { code: SOURCE, title: 'demo.html' } });
    fireEvent.click(screen.getByRole('button', { name: /copy demo.html/i }));

    expect(writeText).toHaveBeenCalledWith(SOURCE);
    await waitFor(() => expect(screen.getByTestId('copy-status').textContent).toContain('copied'));
  });

  it('announces a failure when the clipboard is unavailable', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    document.execCommand = vi.fn().mockReturnValue(false);

    await render(CodeBlock, { inputs: { code: SOURCE } });
    fireEvent.click(screen.getByTestId('copy-code'));

    await waitFor(() =>
      expect(screen.getByTestId('copy-status').textContent).toContain('Copy failed'),
    );
  });

  it('exposes the code as a focusable, labelled region', async () => {
    await render(CodeBlock, { inputs: { code: 'a', title: 'x.ts' } });
    const region = screen.getByRole('region', { name: 'x.ts source code' });
    expect(region.getAttribute('tabindex')).toBe('0');
  });
});
