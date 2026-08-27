import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { DocsFooterNav } from './docs-footer-nav';

describe('DocsFooterNav', () => {
  it('renders both Previous and Next links when prevHref is set', async () => {
    await render(DocsFooterNav, {
      inputs: {
        prevHref: '/docs/api',
        prevLabel: 'API Guide',
        nextHref: '/docs/presets',
        nextLabel: 'Presets',
      },
      providers: [provideRouter([])],
    });

    expect(screen.getByRole('link', { name: /API Guide/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Presets/i })).toBeTruthy();
  });

  it('omits the Previous link when prevHref is not set', async () => {
    await render(DocsFooterNav, {
      inputs: { nextHref: '/docs/get-started', nextLabel: 'Get Started' },
      providers: [provideRouter([])],
    });

    expect(screen.queryByText('Previous')).toBeNull();
    expect(screen.getByRole('link', { name: /Get Started/i })).toBeTruthy();
  });
});
