import { SkinsView } from './skins-view';
import { useSkinSelection } from './use-skins';

export function SkinsRegion() {
  return <SkinsView {...useSkinSelection()} />;
}
