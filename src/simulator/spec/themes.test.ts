import { describe, it, expect } from 'vitest';
import themeOptions from '#/simulator/src/themer/themes';
import { THEME } from '#/assets/constants/theme';

// basic smoke test for newly added aesthetic theme

describe('Theme system', () => {
  it('includes Sunset Glow in the THEME constant', () => {
    expect(THEME['sunset-glow']).toBe('Sunset Glow');
  });

  it('provides a palette for Sunset Glow', () => {
    expect(themeOptions['Sunset Glow']).toBeDefined();
    const colors = themeOptions['Sunset Glow'];
    // navbar background should use a linear-gradient string
    expect(colors['--bg-navbar']).toContain('linear-gradient');
  });
});