import { render, screen } from '@testing-library/angular';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders the title and description', async () => {
    await render(PageHeader, {
      inputs: { title: 'Introduction', description: 'What this library does.' },
    });

    expect(screen.getByRole('heading', { level: 1, name: /introduction/i })).toBeTruthy();
    expect(screen.getByText('What this library does.')).toBeTruthy();
  });
});
