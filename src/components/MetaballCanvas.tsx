import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform float u_time;
  uniform vec2 u_res;

  void main() {
    float shortest = min(u_res.x, u_res.y);
    vec2 pixel = (gl_FragCoord.xy - u_res * 0.5) / shortest;

    vec2 centerCircle = vec2(0.0, 0.0);
    float t = u_time * 0.25;

    float r1 = 0.15;
    vec2 c1 = vec2(cos(t * 1.0) * r1, sin(t * 1.3) * r1);

    float r2 = 0.2;
    vec2 c2 = vec2(sin(t * 0.8 + 2.1) * r2, cos(t * 1.1 + 1.4) * r2);

    float r3 = 0.18;
    vec2 c3 = vec2(cos(t * 0.9 + 4.2) * r3, sin(t * 1.2 + 3.0) * r3);

    float d1 = 0.25 / (length(pixel - (centerCircle + c1)) + 0.01);
    float d2 = 0.25 / (length(pixel - (centerCircle + c2)) + 0.01);
    float d3 = 0.25 / (length(pixel - (centerCircle + c3)) + 0.01);

    float sum = d1 + d2 + d3;

    float val = smoothstep(0.95, 1.05, sum);

    float wave = sin(pixel.y * 25.0 + t * 4.0 + sum * 4.0) * 0.5 + 0.5;
    float striation = smoothstep(0.4, 0.6, wave);

    vec3 metalDeep = vec3(0.06, 0.06, 0.07);
    vec3 metalBright = vec3(0.92, 0.93, 0.95);
    vec3 metalColor = mix(metalDeep, metalBright, striation);

    float edgeGlow = smoothstep(0.0, 0.1, val) - smoothstep(0.1, 0.2, val);
    metalColor += edgeGlow * vec3(0.83, 0.68, 0.21) * 0.6;

    float glow = smoothstep(0.3, 0.9, sum);
    float core = smoothstep(0.6, 1.0, sum);
    float pulse = 0.5 + 0.5 * sin(t * 3.0);
    vec3 glowColor = vec3(0.83, 0.68, 0.21) * glow * (1.0 - core) * pulse;

    vec3 color = vec3(0.0);
    color = mix(color, glowColor, glow * 0.8);
    color = mix(color, metalColor, val);
    color *= 0.9 - length(pixel) * 0.1;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function MetaballCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_res');

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();

    function render() {
      const elapsed = (performance.now() - startTime) / 1000;
      gl!.uniform1f(uTime, elapsed);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    />
  );
}
