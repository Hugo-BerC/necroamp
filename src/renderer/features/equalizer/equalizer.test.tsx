import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { STRINGS } from '@renderer/app/strings/en';
import { createEqStore } from '@renderer/stores/eq-store';
import { EqStoreProvider } from '@renderer/stores/eq-store-context';
import { EqualizerRegion } from './equalizer-region';

function bandSliders(): HTMLElement[] {
  return within(screen.getByRole('group', { name: STRINGS.equalizer.bands })).getAllByRole(
    'slider',
  );
}

function setup() {
  const setEq = vi.fn();
  const store = createEqStore({ setEq });
  render(
    <EqStoreProvider store={store}>
      <EqualizerRegion />
    </EqStoreProvider>,
  );
  return { store, setEq };
}

describe('equalizer region', () => {
  it('renders the inert placeholder without a store', () => {
    render(<EqualizerRegion />);
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByText(STRINGS.equalizer.unavailable)).toBeInTheDocument();
  });

  it('renders ten labelled band sliders plus the preamp', () => {
    setup();
    const bands = within(screen.getByRole('group', { name: STRINGS.equalizer.bands }));
    const sliders = bands.getAllByRole('slider');
    expect(sliders).toHaveLength(10);
    expect(sliders[0]).toHaveAccessibleName('31 Hz gain');
    expect(sliders[9]).toHaveAccessibleName('16 kHz gain');
    expect(sliders[0]).toHaveAttribute('aria-valuetext', '0 dB');
    expect(sliders[0]).toHaveAttribute('min', '-12');
    expect(sliders[0]).toHaveAttribute('max', '12');
    expect(screen.getByRole('slider', { name: STRINGS.equalizer.preamp })).toBeInTheDocument();
  });

  it('changes a band by keyboard and shows Custom', async () => {
    const { store, setEq } = setup();
    const slider = bandSliders()[2] as HTMLInputElement;
    slider.focus();
    fireEvent.change(slider, { target: { value: '5' } });
    expect(store.getState().settings.bands[2]).toBe(5);
    expect(bandSliders()[2]).toHaveAttribute('aria-valuetext', '+5 dB');
    expect(setEq).toHaveBeenLastCalledWith(store.getState().settings);
    const select = screen.getByRole('combobox', { name: STRINGS.equalizer.preset });
    expect(select).toHaveValue('Custom');
    expect(screen.getByRole('option', { name: STRINGS.equalizer.custom })).toBeDisabled();
  });

  it('selects a preset', async () => {
    const { store } = setup();
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: STRINGS.equalizer.preset }),
      'Bass Boost',
    );
    expect(store.getState().settings.preset).toBe('Bass Boost');
    expect(bandSliders()[0]).toHaveAttribute('aria-valuetext', '+8 dB');
    expect(screen.queryByRole('option', { name: STRINGS.equalizer.custom })).toBeNull();
  });

  it('toggles bypass with the keyboard and keeps band values', async () => {
    const { store } = setup();
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: STRINGS.equalizer.preset }),
      'Rock',
    );
    const toggle = screen.getByRole('checkbox', { name: STRINGS.equalizer.bypass });
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(store.getState().settings.bypass).toBe(true);
    expect(toggle).toBeChecked();
    expect(bandSliders()[0]).toHaveAttribute('aria-valuetext', '+5 dB');
  });

  it('changes the preamp', () => {
    const { store } = setup();
    fireEvent.change(screen.getByRole('slider', { name: STRINGS.equalizer.preamp }), {
      target: { value: '-4' },
    });
    expect(store.getState().settings.preampDb).toBe(-4);
    expect(screen.getByRole('slider', { name: STRINGS.equalizer.preamp })).toHaveAttribute(
      'aria-valuetext',
      '-4 dB',
    );
  });
});
