import type { ComponentType } from 'react';
import { EqualizerRegion } from '@renderer/features/equalizer';
import { GithubRegion } from '@renderer/features/github';
import { PlayerRegion } from '@renderer/features/player';
import { PlaylistRegion } from '@renderer/features/playlist';
import { SkinsRegion } from '@renderer/features/skins';
import { VisualizerRegion } from '@renderer/features/visualizer';
import { RegionBoundary } from '@renderer/components/region-boundary';
import { RegionFrame } from '@renderer/components/region-frame';
import { StatusText } from '@renderer/components/status-text';
import type { AppInfoStore } from '@renderer/stores/app-info-store';
import { FOUNDATION_LAYOUT, type RegionId } from './shell-layout';
import { STRINGS } from './strings/en';
import { useAppInfo } from './use-app-info';
import styles from './app-shell.module.css';

const REGION_COMPONENTS: Readonly<Record<RegionId, ComponentType>> = {
  player: PlayerRegion,
  playlist: PlaylistRegion,
  equalizer: EqualizerRegion,
  visualization: VisualizerRegion,
  'skin-selector': SkinsRegion,
  github: GithubRegion,
};

export interface AppShellProps {
  readonly appInfoStore: AppInfoStore;
}

export function AppShell({ appInfoStore }: AppShellProps) {
  const { status, data, failure } = useAppInfo(appInfoStore);
  const bridgeText =
    status === 'failed' && failure !== undefined
      ? `${STRINGS.bridgeStatus.failed}. ${STRINGS.bridgeFailure[failure]}`
      : STRINGS.bridgeStatus[status];
  const tone = status === 'failed' ? 'danger' : status === 'unavailable' ? 'warning' : 'neutral';

  return (
    <div className={styles.shell} data-part="shell">
      <header className={styles.header} data-part="header">
        <h1>{STRINGS.appName}</h1>
        <p data-part="tagline">{STRINGS.tagline}</p>
        <div data-part="app-info" role="group" aria-label={STRINGS.header.appInfoLabel}>
          {data === undefined ? null : (
            <dl>
              <div>
                <dt>{STRINGS.header.version}</dt>
                <dd data-part="app-version">{data.version}</dd>
              </div>
              <div>
                <dt>{STRINGS.header.platform}</dt>
                <dd data-part="app-platform">{STRINGS.platforms[data.platform]}</dd>
              </div>
            </dl>
          )}
        </div>
        <div data-part="status-indicators" role="group" aria-label={STRINGS.header.statusLabel}>
          <dl>
            <div>
              <dt>{STRINGS.header.bridge}</dt>
              <dd>
                <StatusText tone={tone}>{bridgeText}</StatusText>
              </dd>
            </div>
            <div>
              <dt>{STRINGS.header.audioEngine}</dt>
              <dd>{STRINGS.header.audioEngineValue}</dd>
            </div>
          </dl>
        </div>
      </header>
      <main className={styles.regions} data-part="regions">
        {FOUNDATION_LAYOUT.order.map((id) => {
          const Region = REGION_COMPONENTS[id];
          return (
            <RegionBoundary
              key={id}
              fallback={
                <RegionFrame id={id} titleId={`${id}-heading`} heading={STRINGS.regions[id]}>
                  <p role="alert">{STRINGS.regionFailed}</p>
                </RegionFrame>
              }
            >
              <Region />
            </RegionBoundary>
          );
        })}
      </main>
    </div>
  );
}
