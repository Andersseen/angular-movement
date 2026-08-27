import { render, screen } from '@testing-library/angular';
import { ApiStabilityTable } from './api-stability-table';

describe('ApiStabilityTable', () => {
  it('lists moveDrag as experimental, not stable candidate', async () => {
    await render(ApiStabilityTable);

    const experimentalRow = screen.getByText('Experimental').closest('tr');
    expect(experimentalRow?.textContent).toContain('moveDrag');
  });

  it('has no pending stable candidates after the 1.0 freeze', async () => {
    await render(ApiStabilityTable);

    const candidateRow = screen.getByText('Stable candidate').closest('tr');
    expect(candidateRow?.textContent).toContain('None currently');
  });
});
