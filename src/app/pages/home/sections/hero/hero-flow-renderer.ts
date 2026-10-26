/**
 * Depth-of-field particle sphere for the hero: a curl-noise shell folded by fractal octaves,
 * fine steady dust on the focal rim, with everything out of focus fading away. A faithful, dependency-free take on the reference
 * portfolio's Three.js scene — one draw call, no render targets, no simulation state (the flow
 * is a pure function of seed + time, so positions are computed per vertex).
 */

// Ashima / Ian McEwan simplex noise, public domain reference implementation.
const SNOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 snoiseVec3(vec3 x) {
  return vec3(
    snoise(x),
    snoise(vec3(x.y + 31.3169, x.z - 17.9055, x.x + 9.5332)),
    snoise(vec3(x.z + 34.8975, x.x + 11.2364, x.y - 23.7953))
  );
}

// Divergence-free flow field: epsilon-difference curl of vector simplex noise.
vec3 curlNoise(vec3 p) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 p_x0 = snoiseVec3(p - dx);
  vec3 p_x1 = snoiseVec3(p + dx);
  vec3 p_y0 = snoiseVec3(p - dy);
  vec3 p_y1 = snoiseVec3(p + dy);
  vec3 p_z0 = snoiseVec3(p - dz);
  vec3 p_z1 = snoiseVec3(p + dz);

  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

  return normalize(vec3(x, y, z));
}
`;

const VERTEX = `
precision highp float;
attribute vec4 aSeed;
uniform float uTime;
uniform float uAspect;
uniform vec2 uPointer;
varying float vAlpha;
varying float vTint;
varying float vSoft;

const float CAM_DIST = 3.4;
const float FOCUS = 3.4;
const float RADIUS = 1.45;
const float CURL_FREQ = 0.62;

mat3 rotateY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotateX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

void main() {
  float t = uTime * 0.05;
  vec3 seed = aSeed.xyz;
  float rnd = aSeed.w;

  // The reference sphere: curl noise of a point is a unit direction, so particles live on a
  // shell; a fractal octave stack folds that shell into filaments, and a slow noise blend
  // breathes between the two so the surface drifts instead of settling.
  vec3 shell = curlNoise(seed * CURL_FREQ + t);
  vec3 folded = shell;
  folded += curlNoise(folded * CURL_FREQ * 2.0) * 0.5;
  folded += curlNoise(folded * CURL_FREQ * 4.0) * 0.25;
  folded += curlNoise(folded * CURL_FREQ * 8.0) * 0.125;
  vec3 p = mix(shell, folded, snoise(shell + t)) * RADIUS;

  // A slow turntable plus a pointer tilt: the volume reads as 3D, the hero copy never moves.
  p = rotateX(-uPointer.y * 0.22) * rotateY(uTime * 0.02 + uPointer.x * 0.32) * p;

  vec3 view = vec3(p.x, p.y, p.z - CAM_DIST);
  float dist = max(-view.z, 0.4);
  float dof = abs(dist - FOCUS);

  // fov ~46°: the sphere fills most of the hero height and its rim exits the short edges.
  vec2 ndc = (view.xy / dist) * 2.35;
  ndc.x /= uAspect;
  gl_Position = vec4(ndc, 0.0, 1.0);

  // Calm by design: fine, steady dust (no twinkle) and a rare, very faint out-of-focus orb.
  float bokeh = step(0.985, fract(rnd * 7.13));
  float base = mix(1.1 + rnd * 1.1, 10.0 + rnd * 12.0, bokeh);
  float size = base * (1.0 + dof * mix(0.35, 0.5, bokeh));
  gl_PointSize = clamp(size * (FOCUS / dist), 1.0, 36.0);

  // Only the focal rim is bright; everything in front of or behind it falls away quickly,
  // which is what keeps the field soft instead of grainy.
  float band = exp(-dof * dof * mix(2.2, 0.35, bokeh));
  float alpha = mix(mix(0.0, 0.85, band), mix(0.0, 0.05, band), bokeh);

  vAlpha = alpha;
  vSoft = max(bokeh, smoothstep(0.25, 1.0, dof));
  vTint = fract(rnd * 13.73);
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
  float disc = 1.0 - d2;
  float a = pow(disc, mix(1.6, 0.7, vSoft)) * vAlpha * uGain;
  vec3 color = mix(uColorA, uColorB, smoothstep(0.55, 0.92, vTint));
  gl_FragColor = vec4(color * a, a);
}
`;

// Few, fine particles drawn every frame read as smooth; many coarse ones read as noise.
export const HERO_PARTICLE_LIMIT = 10000;

export function heroParticleCount(width: number): number {
  return width < 768 ? 4000 : HERO_PARTICLE_LIMIT;
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
  // Uniform in a unit ball: the curl field turns nearby seeds into shared filaments.
  for (let i = 0; i < data.length; i += 4) {
    let x: number;
    let y: number;
    let z: number;
    do {
      x = random() * 2 - 1;
      y = random() * 2 - 1;
      z = random() * 2 - 1;
    } while (x * x + y * y + z * z > 1);
    data[i] = x * 2.2;
    data[i + 1] = y * 2.2;
    data[i + 2] = z * 2.2;
    data[i + 3] = random();
  }
  return data;
}

// Silver-blue dust with a violet minority; light theme uses saturated inks at lower gain.
const DUST_DARK: [number, number, number] = [0.8, 0.84, 1.0];
const ACCENT_DARK: [number, number, number] = [0.58, 0.5, 1.0];
const DUST_LIGHT: [number, number, number] = [0.24, 0.26, 0.62];
const ACCENT_LIGHT: [number, number, number] = [0.42, 0.24, 0.8];

export interface HeroFlowRenderer {
  resize(width: number, height: number, deviceRatio: number): void;
  draw(time: number, dark: boolean, pointerX: number, pointerY: number): void;
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
  const vertex = compile(gl.VERTEX_SHADER, SNOISE + VERTEX);
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
    },
    draw(time, dark, pointerX, pointerY) {
      gl.uniform1f(timeUniform, time);
      gl.uniform2f(pointerUniform, pointerX, pointerY);
      const dust = dark ? DUST_DARK : DUST_LIGHT;
      const accent = dark ? ACCENT_DARK : ACCENT_LIGHT;
      gl.uniform3f(colorAUniform, dust[0], dust[1], dust[2]);
      gl.uniform3f(colorBUniform, accent[0], accent[1], accent[2]);
      // On light surfaces the field is a faint ink wash: half the particles, a fraction of the gain.
      gl.uniform1f(gainUniform, dark ? 0.9 : 0.26);
      // Dark theme glows additively; light theme composites premultiplied ink over white.
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
