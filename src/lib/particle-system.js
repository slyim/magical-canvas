import { PARTICLE_MAX } from './constants.js';

/**
 * Creates a self-contained particle system.
 * Particles are animated spark lines that burst from the brush stroke.
 * PARTICLE_MAX caps the array to prevent frame drops on long sessions.
 */
export function createParticleSystem(p) {
  let particles = [];

  return {
    /** Add a new particle. Silently drops it if the cap is reached. */
    add(particle) {
      if (particles.length < PARTICLE_MAX) {
        particles.push(particle);
      }
    },

    /** Clear all particles (called on canvas clear). */
    clear() {
      particles = [];
    },

    /** Advance physics and render all live particles. Call once per draw frame. */
    update() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];

        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx += p.random(-1, 1); // Organic drift
        pt.vy += p.random(-1, 1);
        if (pt.angle !== undefined) pt.angle += pt.rotSpeed ?? 0;
        pt.vx *= 0.99; // Air friction
        pt.vy *= 0.99;
        pt.life -= 2;

        if (pt.life <= 0) {
          particles.splice(i, 1);
        } else {
          renderParticle(p, pt);
        }
      }
    },

    get count() { return particles.length; },
  };
}

function renderParticle(p, pt) {
  // Disable per-particle shadow blur — major CPU saver inside tight loops
  p.drawingContext.shadowBlur = 0;

  const pr = pt.r ?? 255;
  const pg = pt.g ?? 255;
  const pb = pt.b ?? 255;
  p.stroke(pr, pg, pb, Math.min(255, pt.life));
  p.strokeWeight(Math.max(1, pt.size * 0.03));
  p.noFill();
  p.strokeCap(p.ROUND);
  p.strokeJoin(p.ROUND);

  const l = pt.size * (pt.lenMult ?? 0.4);
  const a = pt.angle ?? 0;

  // Trig instead of translate/rotate — avoids matrix push/pop overhead
  p.beginShape();
  p.vertex(pt.x - Math.cos(a) * l, pt.y - Math.sin(a) * l);
  p.vertex(pt.x + Math.cos(a) * l, pt.y + Math.sin(a) * l);
  p.endShape();
}
