import { HERO_PARTICLE_LIMIT, heroBackingSize, heroParticleCount } from './hero-flow-renderer';

describe('hero rendering budget', () => {
  it('uses a smaller point draw on compact screens and stays below the fixed desktop ceiling', () => {
    expect(heroParticleCount(390)).toBeLessThan(heroParticleCount(1440));
    for (const width of [320, 390, 768, 1440, 1920, 7680]) {
      expect(heroParticleCount(width)).toBeLessThanOrEqual(HERO_PARTICLE_LIMIT);
    }
    expect(HERO_PARTICLE_LIMIT).toBeLessThanOrEqual(22000);
  });

  it.each([
    [320, 1600],
    [1440, 900],
    [1920, 1080],
    [7680, 4320],
  ])('bounds backing-buffer memory at %s×%s even on a high-DPI display', (width, height) => {
    const size = heroBackingSize(width, height, 3);
    expect(size.width).toBeLessThanOrEqual(1600);
    expect(size.height).toBeLessThanOrEqual(1000);
    expect(size.ratio).toBeLessThanOrEqual(1.5);
    expect(size.width * size.height).toBeLessThanOrEqual(1600000);
  });
});
