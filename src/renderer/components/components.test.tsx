import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ControlButton } from './control-button';
import { RegionBoundary } from './region-boundary';
import { RegionFrame } from './region-frame';
import { StatusText } from './status-text';

describe('ControlButton', () => {
  it('is a focusable native button that uses aria-disabled, not disabled, when unavailable', async () => {
    const onActivate = vi.fn();
    render(
      <>
        <ControlButton label="Play" unavailable describedBy="note" onActivate={onActivate} />
        <p id="note">Not implemented</p>
      </>,
    );
    const button = screen.getByRole('button', { name: 'Play' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAccessibleDescription('Not implemented');
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    await userEvent.click(button);
    expect(onActivate).toHaveBeenCalledTimes(3);
  });

  it('omits aria-disabled when available', () => {
    render(<ControlButton label="Go" onActivate={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Go' })).not.toHaveAttribute('aria-disabled');
  });
});

describe('RegionFrame', () => {
  it('renders a section labelled by its heading with stable hooks', () => {
    render(
      <RegionFrame id="player" titleId="player-heading" heading="Player">
        <p>body</p>
      </RegionFrame>,
    );
    const section = screen.getByRole('region', { name: 'Player' });
    expect(section).toHaveAttribute('data-testid', 'player');
    expect(section).toHaveAttribute('data-region', 'player');
    expect(screen.getByRole('heading', { level: 2, name: 'Player' })).toHaveAttribute(
      'data-part',
      'heading',
    );
    expect(section.querySelector('[data-part="body"]')).toHaveTextContent('body');
  });
});

describe('StatusText', () => {
  it('is a polite status live region', () => {
    render(<StatusText tone="warning">Hello</StatusText>);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Hello');
    expect(status).toHaveAttribute('data-tone', 'warning');
  });
});

describe('RegionBoundary', () => {
  it('renders the fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Broken(): never {
      throw new Error('x');
    }
    render(
      <RegionBoundary fallback={<p role="alert">fallback</p>}>
        <Broken />
      </RegionBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('fallback');
    spy.mockRestore();
  });

  it('renders children when nothing throws', () => {
    render(
      <RegionBoundary fallback={<p>fallback</p>}>
        <p>child</p>
      </RegionBoundary>,
    );
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
