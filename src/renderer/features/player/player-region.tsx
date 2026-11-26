import { PlayerView } from './player-view';
import { usePlayerControls } from './use-player';

export function PlayerRegion() {
  const { controls, message } = usePlayerControls();
  return <PlayerView controls={controls} message={message} />;
}
