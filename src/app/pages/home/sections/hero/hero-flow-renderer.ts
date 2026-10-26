/** A single point draw; no textures, framebuffers, dependencies or per-frame particle uploads. */
const VERTEX = `
precision highp float;
attribute vec4 aSeed;
uniform float uTime;
uniform float uAspect;
uniform float uPixelRatio;
varying float vDepth;
varying float vTint;

// Analytic curl of a trigonometric vector potential: divergence-free, with evolving folds.
vec3 curl(vec3 p, float t) {
  return vec3(
    1.4 * cos(p.y * 1.4 + t) + 1.2 * sin(p.z * 1.2 - t * .8),
    1.2 * cos(p.z * 1.2 + t * .8) + 1.6 * sin(p.x * 1.6 - t * .7),
    1.6 * cos(p.x * 1.6 + t * .7) + 1.4 * sin(p.y * 1.4 - t)
  );
}
void main() {
  float t = uTime * .16;
  vec3 seed = aSeed.xyz;
  vec3 p = curl(seed * 1.7, t) * .48;
  p += curl(seed * 3.4 + 2.1, t * .73) * .22;
  p += curl(seed * 6.8 - 1.3, t * .41) * .09;
  float angle = sin(t * .23) * .5;
  p.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xz;
  float perspective = 1.0 / (1.0 + p.z * .16);
  vec2 cover = vec2(1.0 / min(uAspect, 1.0), max(uAspect, 1.0));
  gl_Position = vec4(p.xy * cover * .7 * perspective, 0.0, 1.0);
  gl_PointSize = (.8 + aSeed.w * .65) * uPixelRatio;
  vDepth = clamp(.5 + p.z * .2, 0.0, 1.0);
  vTint = aSeed.w;
}`;

const FRAGMENT = `
precision mediump float;
uniform float uDark;
varying float vDepth;
varying float vTint;
void main() {
  vec2 point = gl_PointCoord * 2.0 - 1.0;
  float coverage = 1.0 - smoothstep(.2, 1.0, dot(point, point));
  vec3 indigo = mix(vec3(.22, .27, .62), vec3(.46, .57, .95), uDark);
  vec3 silver = mix(vec3(.38, .35, .62), vec3(.82, .84, .96), uDark);
  vec3 color = mix(indigo, silver, smoothstep(.25, .9, vTint));
  float alpha = mix(.24, .6, uDark) * (.35 + vDepth * .65);
  gl_FragColor = vec4(color, coverage * alpha);
}`;

export const HERO_PARTICLE_LIMIT = 16000;

export function heroParticleCount(width: number): number {
  return width < 768 ? 6000 : HERO_PARTICLE_LIMIT;
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
  // Any prefix is distributed over the sphere, so compact screens can draw fewer points.
  for (let i = 0; i < data.length; i += 4) {
    const z = 1 - 2 * random();
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(1 - z * z);
    data[i] = Math.cos(angle) * radius;
    data[i + 1] = Math.sin(angle) * radius;
    data[i + 2] = z;
    data[i + 3] = random();
  }
  return data;
}

export interface HeroFlowRenderer {
  resize(width: number, height: number, deviceRatio: number): void;
  draw(time: number, dark: boolean): void;
  dispose(loseContext?: boolean): void;
}

/** Browser-only; the Angular owner guards initialization and owns its complete lifecycle. */
export function createHeroFlowRenderer(canvas: HTMLCanvasElement): HeroFlowRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  if (!program || !buffer || !vertex || !fragment) {
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }
  gl.shaderSource(vertex, VERTEX);
  gl.shaderSource(fragment, FRAGMENT);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
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
  // Keep framebuffer RGB premultiplied and alpha linear for correct compositing on light themes.
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  const timeUniform = gl.getUniformLocation(program, 'uTime');
  const aspectUniform = gl.getUniformLocation(program, 'uAspect');
  const ratioUniform = gl.getUniformLocation(program, 'uPixelRatio');
  const themeUniform = gl.getUniformLocation(program, 'uDark');
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
      gl.uniform1f(ratioUniform, size.ratio);
    },
    draw(time, dark) {
      gl.uniform1f(timeUniform, time);
      gl.uniform1f(themeUniform, dark ? 1 : 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, count);
    },
    dispose(loseContext = false) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      if (loseContext) gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
