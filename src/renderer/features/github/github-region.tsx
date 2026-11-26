import { GithubView } from './github-view';
import { useGithubPlaceholder } from './use-github';

export function GithubRegion() {
  return <GithubView {...useGithubPlaceholder()} />;
}
