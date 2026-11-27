/** Minimal fake Web Audio objects for unit tests. Counts connections and parameter writes. */
export class FakeParam {
  value = 0;
  readonly targets: Array<{ value: number; time: number; tau: number }> = [];
  setTargetAtTime(value: number, time: number, tau: number): void {
    this.targets.push({ value, time, tau });
  }
}

let nextId = 0;

export class FakeNode {
  readonly id = nextId++;
  readonly kind: string;
  readonly connections: FakeNode[] = [];
  disconnectCalls = 0;
  constructor(kind: string) {
    this.kind = kind;
  }
  connect(target: FakeNode): FakeNode {
    this.connections.push(target);
    return target;
  }
  disconnect(): void {
    this.disconnectCalls += 1;
    this.connections.length = 0;
  }
}

export class FakeBiquad extends FakeNode {
  type = 'peaking';
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
  readonly gain = new FakeParam();
  constructor() {
    super('biquad');
  }
}

export class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
  constructor() {
    super('gain');
  }
}

export class FakeAnalyser extends FakeNode {
  fftSize = 2048;
  smoothingTimeConstant = 0;
  minDecibels = 0;
  maxDecibels = 0;
  frequencyFill = 0;
  timeFill = 128;
  frequencyCalls = 0;
  timeCalls = 0;
  constructor() {
    super('analyser');
  }
  get frequencyBinCount(): number {
    return this.fftSize / 2;
  }
  getByteFrequencyData(out: Uint8Array): void {
    this.frequencyCalls += 1;
    out.fill(this.frequencyFill);
  }
  getByteTimeDomainData(out: Uint8Array): void {
    this.timeCalls += 1;
    out.fill(this.timeFill);
  }
}

export class FakeAudioContext {
  state: 'suspended' | 'running' | 'closed' = 'suspended';
  sampleRate = 48000;
  currentTime = 0;
  readonly destination = new FakeNode('destination');
  readonly nodes: FakeNode[] = [];
  readonly sources: FakeNode[] = [];
  closeCalls = 0;
  resumeCalls = 0;
  resumeShouldFail = false;
  private readonly listeners = new Set<() => void>();

  private track<T extends FakeNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }
  createMediaElementSource(_element: unknown): FakeNode {
    const node = this.track(new FakeNode('source'));
    this.sources.push(node);
    return node;
  }
  createBiquadFilter(): FakeBiquad {
    return this.track(new FakeBiquad());
  }
  createGain(): FakeGain {
    return this.track(new FakeGain());
  }
  createAnalyser(): FakeAnalyser {
    return this.track(new FakeAnalyser());
  }
  addEventListener(type: string, listener: () => void): void {
    if (type === 'statechange') this.listeners.add(listener);
  }
  removeEventListener(type: string, listener: () => void): void {
    if (type === 'statechange') this.listeners.delete(listener);
  }
  get listenerCount(): number {
    return this.listeners.size;
  }
  private setState(state: 'suspended' | 'running' | 'closed'): void {
    this.state = state;
    for (const l of [...this.listeners]) l();
  }
  resume(): Promise<void> {
    this.resumeCalls += 1;
    if (this.resumeShouldFail) return Promise.reject(new Error('resume failed'));
    this.setState('running');
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.closeCalls += 1;
    this.setState('closed');
    return Promise.resolve();
  }
  /** The chain of node kinds starting at the media source, following first connections. */
  chainKinds(): string[] {
    const kinds: string[] = [];
    let node: FakeNode | undefined = this.sources[0];
    while (node !== undefined) {
      kinds.push(node.kind);
      node = node.connections[0];
    }
    return kinds;
  }
}

export function asContext(fake: FakeAudioContext): AudioContext {
  return fake as unknown as AudioContext;
}
