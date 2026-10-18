import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform vec2 u_mouse;
  uniform vec2 u_prevMouse;
  uniform float u_time;
  uniform vec2 u_res;
  varying vec2 v_uv;

  vec2 get_mouse_vel() {
    vec2 vel = (u_mouse - u_prevMouse) * 0.15;
    vel = clamp(vel, -0.06, 0.06);
    return vel;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    uv -= 0.5;
    uv *= 2.0;
    uv.x *= u_res.x / u_res.y;

    vec2 vel = get_mouse_vel();
    uv += vel * 0.5;

    float dist = length(uv);

    float strength = 0.015 * (dist * 0.5 + 0.5);
    float chrom_strength = 0.1 * (dist * 0.5 + 0.5);

    vec2 texUV = v_uv;
    texUV -= 0.5;
    texUV *= 2.0;
    texUV.x *= u_res.x / u_res.y;
    texUV += vel * 0.5;
    texUV.x /= u_res.x / u_res.y;
    texUV /= 2.0;
    texUV += 0.5;

    vec4 texR = texture2D(u_texture, texUV + vec2(chrom_strength, 0.0));
    vec4 texG = texture2D(u_texture, texUV);
    vec4 texB = texture2D(u_texture, texUV - vec2(chrom_strength, 0.0));

    vec4 color = vec4(texR.r, texG.g, texB.b, 1.0);

    color *= 1.0 - (dist * dist) * 0.3;
    color = mix(color, vec4(1.0, 1.0, 1.0, 1.0), smoothstep(0.5, 1.0, dist) * 0.2);

    float noise = sin(uv.y * 100.0 + u_time) * 0.01;
    color += noise;

    gl_FragColor = color;
  }
`;

function ImagePlane({ imageUrl }: { imageUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const prevMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const targetMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const { size, viewport } = useThree();

  const texture = useTexture(imageUrl);

  const uniforms = useMemo(
    () => ({
      u_texture: { value: texture },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_prevMouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [texture, size.width, size.height]
  );

  const handlePointerMove = useCallback(
    (e: THREE.Event) => {
      const native = (e as any).nativeEvent;
      if (!native) return;
      targetMouseRef.current.set(native.clientX / window.innerWidth, 1 - native.clientY / window.innerHeight);
    },
    []
  );

  useFrame((state) => {
    prevMouseRef.current.copy(mouseRef.current);
    mouseRef.current.lerp(targetMouseRef.current, 0.08);

    uniforms.u_mouse.value.copy(mouseRef.current);
    uniforms.u_prevMouse.value.copy(prevMouseRef.current);
    uniforms.u_time.value = state.clock.elapsedTime;
    uniforms.u_res.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
  });

  return (
    <mesh ref={meshRef} onPointerMove={handlePointerMove}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function ShaderImageZoom({ imageUrl }: { imageUrl: string }) {
  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 1], near: 0.1, far: 10 }}
      gl={{ antialias: true }}
    >
      <ImagePlane imageUrl={imageUrl} />
    </Canvas>
  );
}
