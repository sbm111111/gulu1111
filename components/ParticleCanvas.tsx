
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VisualSettings, Theme } from '../types';

// --- SHADERS ---

const vertexShader = `
  uniform float uTime;
  uniform float uAudio;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform sampler2D uTexture;
  uniform bool uHasTexture;
  uniform float uParticleSize;
  uniform float uNoiseStrength;
  uniform float uFlowSpeed;
  uniform float uIsLightMode; // 1.0 for Light, 0.0 for Dark
  
  attribute vec3 aRandom; 
  
  varying vec3 vColor;
  varying float vAlpha;

  // --- Simplex Noise Implementation (Standard) ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec3 pos = position;
    vec2 uv = position.xy / uResolution.xy + 0.5; 
    
    // 1. Texture & Color Logic
    vec4 texColor = vec4(1.0);
    float brightness = 0.0;
    
    if (uHasTexture) {
        texColor = texture2D(uTexture, uv);
        brightness = (texColor.r + texColor.g + texColor.b) / 3.0;
        vColor = texColor.rgb;
        vAlpha = texColor.a * smoothstep(0.15, 0.5, brightness) * 0.8; 
        pos.z += brightness * 30.0;
    } else {
        // Idle State Colors
        if (uIsLightMode > 0.5) {
            // Light Mode: Dark Gray / Slate particles
            vColor = mix(vec3(0.2, 0.2, 0.25), vec3(0.5, 0.5, 0.6), aRandom.x);
        } else {
            // Dark Mode: Green / Blue particles
            vColor = mix(vec3(0.0, 0.8, 0.4), vec3(0.5, 0.5, 1.0), aRandom.x);
        }
        
        vAlpha = (0.5 + 0.5 * sin(uTime + aRandom.y * 10.0)) * 0.6;
        pos.z += sin(uTime * 0.5 + pos.x * 0.1) * 20.0;
    }

    // 2. Fluid Motion (Noise)
    float time = uTime * uFlowSpeed;
    float noiseVal = snoise(pos.xy * 0.015 + vec2(time)); 
    pos.x += noiseVal * uNoiseStrength;
    pos.y += noiseVal * uNoiseStrength;

    // 3. Audio Reactivity
    float audioDisp = uAudio * 15.0; 
    pos.z += audioDisp * aRandom.z * 12.0; 

    // 4. Mouse Interaction
    vec2 mouseWorld = uMouse * uResolution.xy * 0.5; 
    float dist = distance(pos.xy, mouseWorld);
    float repulsionRadius = 150.0;
    if (dist < repulsionRadius) {
        float force = (repulsionRadius - dist) / repulsionRadius;
        vec2 dir = normalize(pos.xy - mouseWorld);
        pos.xy += dir * force * 50.0;
    }

    // 5. Calculate Final Position
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Vignette Logic
    vec2 ndc = gl_Position.xy / gl_Position.w;
    float distFromCenter = length(ndc);
    float mask = 1.0 - smoothstep(0.4, 0.95, distFromCenter);
    vAlpha *= mask;

    // Size attenuation
    gl_PointSize = uParticleSize * (350.0 / -mvPosition.z) * (1.0 + uAudio);
    
    if (vAlpha < 0.01) gl_PointSize = 0.0;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;
    
    // Soft Glow
    float glow = 1.0 - r;
    glow = pow(glow, 2.0); 

    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

interface ParticleCanvasProps {
  imageUrl: string | null;
  audioData?: Uint8Array;
  settings: VisualSettings;
  theme: Theme;
}

const ParticleSystem: React.FC<ParticleCanvasProps> = ({ imageUrl, audioData, settings, theme }) => {
  const meshRef = useRef<THREE.Points>(null);
  const { size, pointer } = useThree();
  
  const texture = useMemo(() => {
    if (!imageUrl) return null;
    return new THREE.TextureLoader().load(imageUrl);
  }, [imageUrl]);

  const { positions, randoms, count } = useMemo(() => {
    const w = 300; 
    const h = 300; 
    const count = w * h;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 3);

    let i = 0;
    const aspect = size.width / size.height;
    const widthWorld = 250 * aspect; 
    const heightWorld = 250;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = (x / w - 0.5) * widthWorld; 
        const v = (y / h - 0.5) * heightWorld;
        
        positions[i * 3] = u;
        positions[i * 3 + 1] = v;
        positions[i * 3 + 2] = 0;

        randoms[i * 3] = Math.random();
        randoms[i * 3 + 1] = Math.random();
        randoms[i * 3 + 2] = Math.random();

        i++;
      }
    }
    return { positions, randoms, count };
  }, [size]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAudio: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uTexture: { value: null },
    uHasTexture: { value: false },
    uParticleSize: { value: 2.0 },
    uNoiseStrength: { value: 0 },
    uFlowSpeed: { value: 0 },
    uIsLightMode: { value: 0.0 }
  }), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    material.uniforms.uIsLightMode.value = theme === 'light' ? 1.0 : 0.0;
    
    let audioAvg = 0;
    if (audioData && audioData.length > 0) {
        let sum = 0;
        const limit = Math.floor(audioData.length / 4); 
        for(let i=0; i<limit; i++) sum += audioData[i];
        audioAvg = (sum / limit) / 255.0;
    }
    material.uniforms.uAudio.value = THREE.MathUtils.lerp(material.uniforms.uAudio.value, audioAvg * settings.audioSensitivity, 0.1);
    material.uniforms.uMouse.value.set(pointer.x, pointer.y);

    if (texture) {
        material.uniforms.uTexture.value = texture;
        material.uniforms.uHasTexture.value = true;
    } else {
        material.uniforms.uHasTexture.value = false;
    }

    material.uniforms.uParticleSize.value = (settings.particleCount / 500) * 2.0;
    material.uniforms.uNoiseStrength.value = settings.noiseStrength;
    material.uniforms.uFlowSpeed.value = settings.flowSpeed;
    material.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        // In Light Mode, Standard blending allows dark particles to show up better on light bg
        // In Dark Mode, Additive blending makes them glow
        blending={theme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
};

const ParticleCanvas: React.FC<ParticleCanvasProps> = (props) => {
  return (
    <div className={`fixed inset-0 z-0 transition-colors duration-1000 ${props.theme === 'light' ? 'bg-cloud' : 'bg-void'}`}>
      <Canvas
        camera={{ position: [0, 0, 150], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: true }}
      >
        {/* Clear color is handled by the div CSS for smooth transition */}
        <ParticleSystem {...props} />
      </Canvas>
    </div>
  );
};

export default ParticleCanvas;
