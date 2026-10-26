/**
 * Ghost fibres for the hero: a few layered ribbons of fine glowing fibres that twist, fold and
 * drift through a shallow depth of field. In focus a fibre is a row of crisp dots; out of focus it
 * blooms into soft, dim bokeh. Everything is a closed-form function of seed and time (sines, no
 * noise, no simulation state), so it is one cheap draw call.
 */

const VERTEX = `
precision highp float;
attribute vec4 aSeed;
uniform float uTime;
uniform float uAspect;
uniform vec2 uPointer;
uniform vec2 uCursor;
uniform float uPull;
uniform float uIntro;
uniform float uPointSize;
varying float vAlpha;
varying float vTint;
varying float vSoft;

const float CAM_DIST = 3.2;
const float FOCUS = 3.0;
const float LENS = 1.55;
const float FIBRES = 18.0;
const float LENS_RADIUS = 0.26;

void main() {
  float t = uTime;
  float u = aSeed.x;            // along the ribbon, -1..1
  float across = aSeed.y;       // across the ribbon, 0..1
  float jitter = aSeed.z;       // 0..1
  float r = floor(aSeed.w * 3.0);
  float dust = step(0.92, fract(aSeed.w * 9.7));

  // Each ribbon is a slow travelling wave that rises left to right, each on its own phase. A
  // second, slower swell keeps the fold positions from ever repeating exactly.
  float phase = r * 2.1;
  // Narrow (portrait) canvases get a shorter span so the ribbons still cross the frame.
  float span = clamp(uAspect / 1.6, 0.55, 1.0);
  float x = u * 2.6 * span;
  float swell = sin(t * 0.07 + phase) * 0.12;
  float y = (0.42 + swell) * sin(u * 1.7 + t * 0.22 + phase)
          + 0.16 * sin(u * 3.3 - t * 0.17 + phase * 1.7)
          + u * 0.75 * span + (r - 1.0) * 0.42;
  float z = 1.1 * sin(u * 1.25 + t * 0.15 + phase * 0.6) + 0.35;

  // Fibres: the width is split into evenly spaced strands, each a dotted line along the ribbon.
  float strand = (floor(across * FIBRES) + 0.5) / FIBRES * 2.0 - 1.0;
  float width = 0.2 + 0.1 * sin(u * 2.3 + phase + t * 0.1);
  // The twist folds the ribbon edge-on to the camera, which is where it reads as a bright streak.
  float twist = u * 2.6 + t * 0.2 + phase;
  vec3 p = vec3(x, y, z) + vec3(0.0, cos(twist), sin(twist)) * strand * width;
  p += vec3(0.0, 0.004, 0.004) * (jitter - 0.5);

  // A loose haze of free-floating dust around the ribbons for depth, drifting very slowly.
  vec3 haze = vec3(u * 2.8, (across * 2.0 - 1.0) * 1.6, (jitter * 2.0 - 1.0) * 1.8);
  haze.y += sin(t * 0.05 + u * 3.0 + jitter * 6.28) * 0.08;
  p = mix(p, haze, dust);

  // Weighted parallax: a small yaw and pitch of the whole volume toward the pointer.
  float yaw = uPointer.x * 0.16;
  float pitch = -uPointer.y * 0.1;
  p.xz = mat2(cos(yaw), -sin(yaw), sin(yaw), cos(yaw)) * p.xz;
  p.yz = mat2(cos(pitch), -sin(pitch), sin(pitch), cos(pitch)) * p.yz;

  float depth = CAM_DIST - p.z;
  vec2 ndc = p.xy / max(depth, 0.1) * LENS;
  ndc.x /= uAspect;

  // The cursor is a lens: fibres near it part a little, pull into focus and brighten. Measured
  // in aspect-corrected space so the lens is round; uPull fades it in on movement and out at rest.
  vec2 toPoint = (ndc - uCursor) * vec2(uAspect, 1.0);
  float reach = length(toPoint);
  float lens = uPull * exp(-(reach * reach) / (2.0 * LENS_RADIUS * LENS_RADIUS));
  ndc += (toPoint / (reach + 0.04)) * vec2(1.0 / uAspect, 1.0) * lens * 0.09;

  // The intro unfurls each ribbon from left to right instead of popping the whole field in.
  float sweep = uIntro * 2.6 - 1.3;
  float reveal = smoothstep(0.0, 0.3, sweep - u);
  gl_Position = vec4(ndc, depth > 0.1 ? 0.0 : 2.0, 1.0);

  // Depth of field: the circle of confusion grows with distance from the focal plane, and the
  // same light spread over a bigger disc gets dimmer, so bokeh stays soft instead of loud.
  float coc = abs(depth - FOCUS) * (1.0 - 0.85 * lens);
  float size = uPointSize * (1.4 + coc * 9.0 + dust * 3.0);
  gl_PointSize = min(size, 48.0);
  float spread = (uPointSize * 1.4) / gl_PointSize;
  vAlpha = mix(0.9, 0.35, dust) * spread * spread * 1.6 * smoothstep(1.0, 0.75, abs(u))
         * reveal * (1.0 + lens * 2.6);
  vSoft = smoothstep(0.05, 0.4, coc);
  vTint = clamp(jitter + lens * 0.6, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uGain;
varying float vAlpha;
varying float vTint;
varying float vSoft;

void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d2 = dot(q, q);
  if (d2 > 1.0) discard;
  // Crisp dots in focus, flat soft discs (with a faint rim) out of it.
  float core = mix(pow(1.0 - d2, 1.5), 0.55 + 0.45 * smoothstep(0.55, 1.0, d2), vSoft);
  float a = min(vAlpha, 1.0) * core * uGain;
  vec3 color = mix(uColorA, uColorB, vTint);
  gl_FragColor = vec4(color * a, a);
}
`;

// Enough points for the fibres to read as continuous strands; each vertex is a handful of sines.
export const HERO_PARTICLE_LIMIT = 60000;

export function heroParticleCount(width: number): number {
  return width < 768 ? 24000 : HERO_PARTICLE_LIMIT;
}

export function heroBackingSize(width: number, height: number, deviceRatio: number) {
  const ratio = Math.min(deviceRatio || 1, 1.5, 1600 / width, 1000 / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    ratio,
  };
}

function seeds(): Float32Array {
  const data = new Float32Array(HERO_PARTICLE_LIMIT * 4);
  let state = 0x4d4f5645;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  // x: position along a ribbon, y: across it, z: jitter, w: ribbon / dust selector.
  for (let i = 0; i < data.length; i += 4) {
    data[i] = random() * 2 - 1;
    data[i + 1] = random();
    data[i + 2] = random();
    data[i + 3] = random();
  }
  return data;
}

// Violet fibres warming to lilac highlights; light theme uses saturated inks at lower gain.
const DUST_DARK: [number, number, number] = [0.5, 0.42, 1.0];
const ACCENT_DARK: [number, number, number] = [0.86, 0.74, 1.0];
const DUST_LIGHT: [number, number, number] = [0.33, 0.24, 0.86];
const ACCENT_LIGHT: [number, number, number] = [0.6, 0.28, 0.92];

/** Everything a frame depends on; positions are canvas NDC (-1..1, y up). */
export interface HeroFlowFrame {
  readonly time: number;
  readonly dark: boolean;
  /** Slow, weighted pointer for the whole-volume parallax. */
  readonly pointerX: number;
  readonly pointerY: number;
  /** Fast pointer for the local lens, and how strongly the lens is on (0..1). */
  readonly cursorX: number;
  readonly cursorY: number;
  readonly pull: number;
  /** 0 → 1 over the entrance; 1 when motion is reduced. */
  readonly intro: number;
}

export interface HeroFlowRenderer {
  resize(width: number, height: number, deviceRatio: number): void;
  draw(frame: HeroFlowFrame): void;
  dispose(loseContext?: boolean): void;
}

/** Browser-only; the Angular owner guards initialization and owns its complete lifecycle. */
export function createHeroFlowRenderer(
  canvas: HTMLCanvasElement | OffscreenCanvas,
): HeroFlowRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const adapterInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const adapter = adapterInfo ? String(gl.getParameter(adapterInfo.UNMASKED_RENDERER_WEBGL)) : '';
  // Some browsers accept an explicitly selected software adapter despite the caveat flag.
  // Reject it before shader compilation; this decoration must not move GPU work onto the CPU.
  if (/swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(adapter)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  if (!program || !buffer || !vertex || !fragment) {
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aSeed');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, seeds(), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);

  const timeUniform = gl.getUniformLocation(program, 'uTime');
  const aspectUniform = gl.getUniformLocation(program, 'uAspect');
  const pointerUniform = gl.getUniformLocation(program, 'uPointer');
  const colorAUniform = gl.getUniformLocation(program, 'uColorA');
  const colorBUniform = gl.getUniformLocation(program, 'uColorB');
  const gainUniform = gl.getUniformLocation(program, 'uGain');
  const pointSizeUniform = gl.getUniformLocation(program, 'uPointSize');
  const cursorUniform = gl.getUniformLocation(program, 'uCursor');
  const pullUniform = gl.getUniformLocation(program, 'uPull');
  const introUniform = gl.getUniformLocation(program, 'uIntro');
  let count = HERO_PARTICLE_LIMIT;

  return {
    resize(width, height, deviceRatio) {
      const size = heroBackingSize(width, height, deviceRatio);
      count = heroParticleCount(width);
      if (canvas.width !== size.width || canvas.height !== size.height) {
        canvas.width = size.width;
        canvas.height = size.height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(aspectUniform, width / height);
      // One CSS pixel per point, whatever the backing-store ratio.
      gl.uniform1f(pointSizeUniform, Math.max(1, size.ratio));
    },
    draw({ time, dark, pointerX, pointerY, cursorX, cursorY, pull, intro }) {
      gl.uniform1f(timeUniform, time);
      gl.uniform2f(pointerUniform, pointerX, pointerY);
      gl.uniform2f(cursorUniform, cursorX, cursorY);
      gl.uniform1f(pullUniform, pull);
      gl.uniform1f(introUniform, intro);
      const dust = dark ? DUST_DARK : DUST_LIGHT;
      const accent = dark ? ACCENT_DARK : ACCENT_LIGHT;
      gl.uniform3f(colorAUniform, dust[0], dust[1], dust[2]);
      gl.uniform3f(colorBUniform, accent[0], accent[1], accent[2]);
      // On light surfaces the field is a violet ink wash: half the particles at about half the gain.
      gl.uniform1f(gainUniform, dark ? 0.9 : 0.5);
      // Dark theme glows additively, so overlapping fibres bloom; light theme composites
      // premultiplied ink over white.
      if (dark) {
        gl.blendFunc(gl.ONE, gl.ONE);
      } else {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, dark ? count : Math.floor(count / 2));
    },
    dispose(loseContext = false) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      if (loseContext) gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
