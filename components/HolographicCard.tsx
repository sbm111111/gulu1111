
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { VisualSettings } from '../types';

// --- SHADER: CONFIGURABLE SAND DISSOLVE ---

const vertexShader = `
  uniform float uTime;
  uniform sampler2D uTexture;
  
  // Controls
  uniform float uDispersion;   // How far edges spread (0.0 - 1.5)
  uniform float uNoiseStrength;// Turbulence amplitude (0.0 - 5.0)
  uniform float uFlowSpeed;    // Speed of noise movement (0.0 - 2.0)
  uniform float uParticleSize; // Base size scaler (1.0 - 5.0)

  varying vec3 vColor;
  varying float vAlpha;

  // --- Simplex Noise Functions ---
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
    vec2 uv = uv; 

    // 1. Texture Sampling
    vec4 texColor = texture2D(uTexture, uv);
    vColor = texColor.rgb;

    // 2. Sand Logic
    // Start with a base ellipse mask
    float dist = distance(uv, vec2(0.5));
    
    // Create animated noise field
    float noise = snoise(uv * 5.0 + uTime * uFlowSpeed); 
    
    // Core radius is 0.4.
    // If uDispersion is 0, we cut sharply at 0.5.
    // If uDispersion > 0, we affect particles further out.
    
    // 'scatter' determines if a particle is in the "dissolving zone"
    // Zone starts at 0.35 and ends at 0.5 + uDispersion
    float noiseInfluence = noise * uNoiseStrength * 0.1; // Scale noise influence
    
    // A value 0..1 representing how "detached" the particle is
    float detachment = smoothstep(0.35, 0.45 + uDispersion + noiseInfluence, dist);
    
    if (detachment > 0.0) {
        // Direction of flow: Radial outward + Noise
        vec2 dir = normalize(uv - 0.5);
        vec2 turb = vec2(snoise(uv * 10.0 + uTime), snoise(uv * 10.0 + uTime + 100.0));
        
        // Final displacement
        vec2 offset = (dir + turb * 0.5) * detachment * (20.0 * uDispersion);
        
        pos.xy += offset;
        
        // Z-lift for detached particles
        pos.z += detachment * 15.0 * uDispersion;
    }

    // 3. Alpha calculation
    // Fade out based on detachment
    float alphaFade = 1.0 - smoothstep(0.8, 1.0, detachment);
    vAlpha = texColor.a * alphaFade;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // 4. Size calculation
    // Outer particles are slightly smaller/dustier
    float size = uParticleSize * (300.0 / -mvPosition.z);
    size *= (1.0 - detachment * 0.5); 
    gl_PointSize = size;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    if (dot(cxy, cxy) > 1.0) discard;

    gl_FragColor = vec4(vColor, vAlpha);
  }
`;

interface HologramProps {
    imageUrl: string;
    settings?: VisualSettings;
}

const Hologram: React.FC<HologramProps> = ({ imageUrl, settings }) => {
  const meshRef = useRef<THREE.Points>(null);
  const texture = useTexture(imageUrl);
  
  const img = texture.image as HTMLImageElement;
  const aspect = img.width / img.height;
  const height = 60; 
  const width = height * aspect; 

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTexture: { value: texture },
    // Defaults if settings not provided
    uDispersion: { value: 0.0 },
    uNoiseStrength: { value: 0.5 },
    uFlowSpeed: { value: 0.2 },
    uParticleSize: { value: 2.0 }
  }), [texture]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    
    if (settings) {
        // Smoothly interpolate towards target settings for better feel
        const lerpFactor = 0.1;
        material.uniforms.uDispersion.value = THREE.MathUtils.lerp(material.uniforms.uDispersion.value, settings.dispersion, lerpFactor);
        material.uniforms.uNoiseStrength.value = THREE.MathUtils.lerp(material.uniforms.uNoiseStrength.value, settings.noiseStrength, lerpFactor);
        material.uniforms.uFlowSpeed.value = THREE.MathUtils.lerp(material.uniforms.uFlowSpeed.value, settings.flowSpeed, lerpFactor);
        material.uniforms.uParticleSize.value = THREE.MathUtils.lerp(material.uniforms.uParticleSize.value, settings.particleCount, lerpFactor);
    }
  });

  return (
    <points ref={meshRef} rotation={[0, 0, 0]}>
      {/* Increased grid density for better sand effect */}
      <planeGeometry args={[width, height, 256, 256]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending} 
      />
    </points>
  );
};

export const HolographicCard: React.FC<HologramProps> = ({ imageUrl, settings }) => {
  if (!imageUrl) return null;
  return (
    <div className="w-full h-full animate-fade-in relative cursor-pointer"> 
        <Canvas
            camera={{ position: [0, 0, 80], fov: 45 }} 
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
            className="pointer-events-auto"
        >
            <React.Suspense fallback={null}>
                <Hologram imageUrl={imageUrl} settings={settings} />
            </React.Suspense>
        </Canvas>
    </div>
  );
};
