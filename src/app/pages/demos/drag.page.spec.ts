import { provideMovement } from 'movement';
import { render, screen } from '@testing-library/angular';
import DemoDrag from './drag.page';

describe('DemoDrag', () => {
  it('shows a Replay control so a dragged-out-of-view card can be reset', async () => {
    await render(DemoDrag, { providers: [provideMovement()] });

    expect(screen.getByRole('button', { name: /replay/i })).toBeTruthy();
  });

  it('recreates the draggable card (resetting its position) when replay runs', async () => {
    const { fixture } = await render(DemoDrag, { providers: [provideMovement()] });
    const component = fixture.componentInstance;

    component['replay']();
    expect(component['showDemo']()).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(component['showDemo']()).toBe(true);
  });

  it('resets the card whenever a control changes', async () => {
    const { fixture } = await render(DemoDrag, { providers: [provideMovement()] });
    const component = fixture.componentInstance;

    component['onStateChange']({
      preset: 'fade-up',
      duration: 300,
      delay: 0,
      easing: 'ease',
      axis: 'x',
    });

    expect(component['showDemo']()).toBe(false);
  });
});
