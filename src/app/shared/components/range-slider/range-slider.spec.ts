import { render, screen, fireEvent } from '@testing-library/angular';
import { RangeSlider } from './range-slider';

describe('RangeSlider', () => {
  it('associates the label with its input via controlId', async () => {
    await render(RangeSlider, {
      inputs: { controlId: 'scale', label: 'Scale', value: 1, min: 0, max: 2, step: 0.05 },
    });

    expect(screen.getByLabelText('Scale')).toBeTruthy();
  });

  it('emits the new numeric value on input', async () => {
    const onValueChange = vi.fn();
    await render(RangeSlider, {
      inputs: { controlId: 'scale', label: 'Scale', value: 1, min: 0, max: 2, step: 0.05 },
      on: { valueChange: onValueChange },
    });

    const slider = screen.getByLabelText('Scale') as HTMLInputElement;
    fireEvent.input(slider, { target: { value: '1.5' } });

    expect(onValueChange).toHaveBeenCalledWith(1.5);
  });

  it('does not duplicate the controlId onto the component host', async () => {
    const { container } = await render(RangeSlider, {
      inputs: { controlId: 'scale', label: 'Scale', value: 1 },
    });

    expect(container.querySelectorAll('#scale').length).toBe(1);
  });
});
