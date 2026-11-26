import { describe, expect, it } from 'vitest';
import { isTrustedSender, type SenderEventLike } from './sender-validation';

const TRUSTED = ['app://renderer'];
const SENDER: { id: string; mainFrame: unknown } = { id: 'main-contents', mainFrame: undefined };
const registered = (sender: unknown): boolean => sender === SENDER;

/** Builds an event whose frame is the sender's main frame unless sender is overridden. */
const event = (url: string, parent: unknown = null, sender: unknown = SENDER): SenderEventLike => {
  const senderFrame = { url, parent };
  if (sender === SENDER) SENDER.mainFrame = senderFrame;
  return { senderFrame, sender };
};

describe('isTrustedSender', () => {
  it('accepts the top frame of the registered contents on a trusted origin', () => {
    expect(isTrustedSender(event('app://renderer/index.html'), TRUSTED, registered)).toBe(true);
  });

  it('rejects a null or missing sender frame', () => {
    expect(isTrustedSender({ senderFrame: null, sender: SENDER }, TRUSTED, registered)).toBe(false);
    expect(isTrustedSender({ senderFrame: undefined, sender: SENDER }, TRUSTED, registered)).toBe(
      false,
    );
  });

  it('rejects a sub-frame even on a trusted origin', () => {
    expect(
      isTrustedSender(event('app://renderer/x.html', { top: true }), TRUSTED, registered),
    ).toBe(false);
  });

  it('rejects a frame whose parent is undefined (fail closed)', () => {
    const noParent: SenderEventLike = {
      senderFrame: { url: 'app://renderer/' } as unknown as { url: string; parent: unknown },
      sender: SENDER,
    };
    expect(isTrustedSender(noParent, TRUSTED, registered)).toBe(false);
  });

  it.each([
    'https://evil.test/',
    'file:///C:/index.html',
    'about:blank',
    'app://evil/',
    'app://renderer.evil.test/',
    'http://localhost:5173/',
    '',
  ])('rejects an untrusted url %s', (url) => {
    expect(isTrustedSender(event(url), TRUSTED, registered)).toBe(false);
  });

  it('accepts the dev origin only when it is in the trusted set', () => {
    const url = 'http://localhost:5173/';
    expect(isTrustedSender(event(url), [...TRUSTED, 'http://localhost:5173'], registered)).toBe(
      true,
    );
    expect(isTrustedSender(event(url), TRUSTED, registered)).toBe(false);
  });

  it('rejects a top-level frame that is not the sender main frame', () => {
    const other = { url: 'app://renderer/other', parent: null };
    SENDER.mainFrame = { url: 'app://renderer/', parent: null };
    expect(isTrustedSender({ senderFrame: other, sender: SENDER }, TRUSTED, registered)).toBe(
      false,
    );
  });

  it('rejects an equal-looking frame object that is not the same identity', () => {
    SENDER.mainFrame = { url: 'app://renderer/', parent: null };
    const clone = { url: 'app://renderer/', parent: null };
    expect(isTrustedSender({ senderFrame: clone, sender: SENDER }, TRUSTED, registered)).toBe(
      false,
    );
  });

  it.each([undefined, null])('rejects when the sender main frame is %s', (mainFrame) => {
    const frame = { url: 'app://renderer/', parent: null };
    const sender = { mainFrame };
    expect(isTrustedSender({ senderFrame: frame, sender }, TRUSTED, () => true)).toBe(false);
  });

  it('rejects when the sender is not an object', () => {
    const frame = { url: 'app://renderer/', parent: null };
    expect(isTrustedSender({ senderFrame: frame, sender: 'x' }, TRUSTED, () => true)).toBe(false);
  });

  it('rejects an unregistered sender', () => {
    expect(isTrustedSender(event('app://renderer/', null, {}), TRUSTED, registered)).toBe(false);
    // The frame is the main frame of `foreign`, so only the registration check can reject it.
    const frame = { url: 'app://renderer/', parent: null };
    const foreign = { mainFrame: frame };
    expect(isTrustedSender({ senderFrame: frame, sender: foreign }, TRUSTED, registered)).toBe(
      false,
    );
    expect(isTrustedSender({ senderFrame: frame, sender: foreign }, TRUSTED, () => true)).toBe(
      true,
    );
    expect(
      isTrustedSender(
        { senderFrame: { url: 'app://renderer/', parent: null } },
        TRUSTED,
        registered,
      ),
    ).toBe(false);
  });

  it('fails closed when reading the frame throws', () => {
    const throwing: SenderEventLike = {
      get senderFrame(): never {
        throw new Error('frame destroyed');
      },
    };
    expect(isTrustedSender(throwing, TRUSTED, registered)).toBe(false);
  });

  it('fails closed when the registration check throws', () => {
    const boom = (): boolean => {
      throw new Error('boom');
    };
    expect(isTrustedSender(event('app://renderer/'), TRUSTED, boom)).toBe(false);
  });
});
