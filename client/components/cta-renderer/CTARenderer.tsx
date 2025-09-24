/**
 * AR/VR/3D CTA Renderer - Main React Component
 * Empire-Grade Cross-Platform 3D/AR/VR CTA System
 */

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  PerspectiveCamera, 
  useGLTF,
  Html,
  Text,
  Box,
  Sphere
} from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, RotateCcw, Maximize } from 'lucide-react';

interface CTARendererProps {
  instanceId: string;
  templateType: 'three_js' | 'babylonjs' | 'aframe';
  config: Record<string, any>;
  onInteraction?: (eventType: string, data: any) => void;
  onConversion?: (data: any) => void;
  className?: string;
}

interface CTAInstanceData {
  instance: any;
  template: any;
  config: any;
  context: any;
  assets: any[];
}

export const CTARenderer: React.FC<CTARendererProps> = ({
  instanceId,
  templateType,
  config,
  onInteraction,
  onConversion,
  className = ''
}) => {
  const [ctaData, setCtaData] = useState<CTAInstanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load CTA instance data
  useEffect(() => {
    const loadCTAData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/cta-renderer/instances/${instanceId}/render`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'current-session',
            contextData: { pageUrl: window.location.href },
            deviceCapabilities: getDeviceCapabilities()
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to load CTA: ${response.statusText}`);
        }

        const data = await response.json();
        setCtaData(data);
        
        // Track impression
        onInteraction?.('impression', { instanceId, timestamp: Date.now() });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CTA');
      } finally {
        setLoading(false);
      }
    };

    loadCTAData();
  }, [instanceId, onInteraction]);

  // Get device capabilities for optimization
  const getDeviceCapabilities = () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    return {
      webgl: gl ? (gl.getParameter(gl.VERSION).includes('WebGL 2') ? 2 : 1) : 0,
      webxr: 'xr' in navigator,
      memory: (navigator as any).deviceMemory || 4,
      platform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      screenSize: { width: window.innerWidth, height: window.innerHeight }
    };
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Handle interaction tracking
  const trackInteraction = (eventType: string, additionalData: any = {}) => {
    onInteraction?.(eventType, {
      instanceId,
      timestamp: Date.now(),
      ...additionalData
    });
  };

  // Handle conversion
  const handleConversion = (conversionData: any = {}) => {
    onConversion?.({
      instanceId,
      timestamp: Date.now(),
      ...conversionData
    });
    trackInteraction('conversion', conversionData);
  };

  if (loading) {
    return (
      <Card className={`w-full h-96 ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading 3D experience...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full h-96 ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load 3D experience</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ctaData) return null;

  const renderThreeJSScene = () => (
    <Canvas
      ref={canvasRef}
      camera={{ position: [0, 0, 5], fov: 75 }}
      onCreated={({ gl }) => {
        gl.setClearColor('#f0f0f0');
        trackInteraction('3d_scene_loaded');
      }}
      onClick={() => trackInteraction('canvas_click')}
    >
      <Suspense fallback={<Html><Loader2 className="animate-spin" /></Html>}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls 
          enablePan={ctaData.config.controls?.pan !== false}
          enableZoom={ctaData.config.controls?.zoom !== false}
          enableRotate={ctaData.config.controls?.rotate !== false}
          onStart={() => trackInteraction('orbit_start')}
          onEnd={() => trackInteraction('orbit_end')}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <pointLight position={[-5, -5, -5]} intensity={0.3} />

        {/* Environment */}
        {ctaData.config.environment && (
          <Environment preset={ctaData.config.environment.preset || 'sunset'} />
        )}

        {/* Render based on CTA type */}
        {ctaData.template.category === '3d_product' && (
          <Product3DViewer 
            assets={ctaData.assets}
            config={ctaData.config}
            onInteraction={trackInteraction}
          />
        )}

        {ctaData.template.category === 'ar_tryOn' && (
          <ARTryOnExperience 
            assets={ctaData.assets}
            config={ctaData.config}
            onInteraction={trackInteraction}
          />
        )}

        {ctaData.template.category === 'gamified_cta' && (
          <GamifiedCTA 
            assets={ctaData.assets}
            config={ctaData.config}
            onInteraction={trackInteraction}
            onConversion={handleConversion}
          />
        )}

        {/* CTA UI Overlay */}
        <CTAOverlay 
          config={ctaData.config}
          onConversion={handleConversion}
          onInteraction={trackInteraction}
        />
      </Suspense>
    </Canvas>
  );

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-96 bg-background border rounded-lg overflow-hidden ${className}`}
    >
      {/* Control Bar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setIsPlaying(!isPlaying);
            trackInteraction(isPlaying ? 'pause' : 'play');
          }}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            // Reset camera position
            trackInteraction('reset_view');
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={toggleFullscreen}
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* Template Info Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Badge variant="outline" className="bg-background/80 backdrop-blur">
          {ctaData.template.name}
        </Badge>
      </div>

      {/* 3D Scene */}
      {templateType === 'three_js' && renderThreeJSScene()}
      
      {/* Performance Info (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 z-10 text-xs text-muted-foreground bg-background/80 backdrop-blur p-2 rounded">
          Instance: {instanceId}<br />
          Template: {ctaData.template.templateId}<br />
          Type: {templateType}
        </div>
      )}
    </div>
  );
};

// 3D Product Viewer Component
const Product3DViewer: React.FC<{ assets: any[], config: any, onInteraction: (type: string, data?: any) => void }> = ({
  assets, config, onInteraction
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && config.animations?.autoRotate) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <Box
        ref={meshRef}
        args={[2, 2, 2]}
        onPointerOver={() => {
          setHovered(true);
          onInteraction('product_hover');
        }}
        onPointerOut={() => setHovered(false)}
        onClick={() => onInteraction('product_click')}
      >
        <meshStandardMaterial 
          color={hovered ? config.colors?.hover || '#4f46e5' : config.colors?.primary || '#6366f1'}
          metalness={0.7}
          roughness={0.3}
        />
      </Box>
      
      {/* Product Info */}
      <Html position={[0, -2, 0]} center>
        <div className="text-center bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg">
          <h3 className="font-semibold">{config.product?.name || 'Demo Product'}</h3>
          <p className="text-sm text-muted-foreground">{config.product?.description || 'Interactive 3D preview'}</p>
        </div>
      </Html>
    </group>
  );
};

// AR Try-On Experience Component
const ARTryOnExperience: React.FC<{ assets: any[], config: any, onInteraction: (type: string, data?: any) => void }> = ({
  assets, config, onInteraction
}) => {
  return (
    <group>
      <Sphere args={[1]} position={[0, 0, 0]} onClick={() => onInteraction('ar_activate')}>
        <meshStandardMaterial color="#ff6b6b" transparent opacity={0.7} />
      </Sphere>
      
      <Html position={[0, -2, 0]} center>
        <Button 
          onClick={() => onInteraction('ar_try_on')}
          className="bg-primary text-primary-foreground"
        >
          Try in AR
        </Button>
      </Html>
    </group>
  );
};

// Gamified CTA Component
const GamifiedCTA: React.FC<{ 
  assets: any[], 
  config: any, 
  onInteraction: (type: string, data?: any) => void,
  onConversion: (data?: any) => void 
}> = ({ assets, config, onInteraction, onConversion }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const wheelRef = useRef<THREE.Group>(null);

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    onInteraction('spin_start');
    
    // Simulate spin result after 3 seconds
    setTimeout(() => {
      setIsSpinning(false);
      onInteraction('spin_complete', { result: 'win' });
      onConversion({ type: 'spin_wheel', result: 'win' });
    }, 3000);
  };

  useFrame(() => {
    if (wheelRef.current && isSpinning) {
      wheelRef.current.rotation.z += 0.3;
    }
  });

  return (
    <group>
      <group ref={wheelRef}>
        <Sphere args={[1.5]} onClick={spinWheel}>
          <meshStandardMaterial 
            color={isSpinning ? '#fbbf24' : '#f59e0b'} 
            metalness={0.3}
            roughness={0.4}
          />
        </Sphere>
      </group>
      
      <Html position={[0, -3, 0]} center>
        <div className="text-center">
          <Button 
            onClick={spinWheel}
            disabled={isSpinning}
            size="lg"
            className="mb-2"
          >
            {isSpinning ? 'Spinning...' : 'Spin to Win!'}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isSpinning ? 'Good luck! 🍀' : 'Click the sphere or button to spin'}
          </p>
        </div>
      </Html>
    </group>
  );
};

// CTA Overlay Component
const CTAOverlay: React.FC<{ 
  config: any, 
  onConversion: (data?: any) => void,
  onInteraction: (type: string, data?: any) => void 
}> = ({ config, onConversion, onInteraction }) => {
  if (!config.showOverlay) return null;

  return (
    <Html position={[0, 2, 0]} center>
      <Card className="w-64 bg-background/95 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{config.overlay?.title || 'Special Offer'}</CardTitle>
          <CardDescription>{config.overlay?.description || 'Limited time offer'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => {
              onInteraction('cta_click');
              onConversion({ source: 'overlay_cta' });
            }}
            className="w-full"
            size="lg"
          >
            {config.overlay?.buttonText || 'Get Started'}
          </Button>
        </CardContent>
      </Card>
    </Html>
  );
};

export default CTARenderer;