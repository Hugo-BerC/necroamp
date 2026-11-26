import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures/launch';

// T7.4 (R9.6, V10): automated accessibility scan of the real page. Imports of axe stay in tests/e2e (E1).
test.describe('accessibility scan', () => {
  test('has no serious or critical axe violations in the initial window', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Connected')).toBeVisible();
    const results = await new AxeBuilder({ page })
      // Electron cannot create the extra page that cross-frame mode needs (Target.createTarget is unsupported).
      // The shell has no iframe, so single-frame legacy mode scans the whole document.
      .setLegacyMode(true)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const blocking = results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ')) }));
    expect(blocking).toEqual([]);
    // Recorded for the report: minor and moderate findings and checks that need review.
    test.info().annotations.push({
      type: 'axe',
      description: JSON.stringify({
        passes: results.passes.length,
        nonBlocking: results.violations
          .filter((v) => v.impact !== 'serious' && v.impact !== 'critical')
          .map((v) => `${v.id}:${v.impact}`),
        incomplete: results.incomplete.map((v) => v.id),
      }),
    });
  });
});
