import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface RegionBoundaryProps {
  readonly fallback: ReactNode;
  readonly children: ReactNode;
}

interface RegionBoundaryState {
  readonly failed: boolean;
}

/** Keeps one failing region from blanking the shell. The error is not shown or logged (no payloads). */
export class RegionBoundary extends Component<RegionBoundaryProps, RegionBoundaryState> {
  override state: RegionBoundaryState = { failed: false };

  static getDerivedStateFromError(): RegionBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally empty: the fallback is the handling. No telemetry exists (R15.1).
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
