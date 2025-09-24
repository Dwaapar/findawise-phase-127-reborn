/**
 * AR/VR/3D CTA Renderer Component - Frontend Implementation
 * Billion-Dollar Empire Grade Immersive Experience Engine
 */

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Html, useGLTF, Stats } from '@react-three/drei';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  VolumeX, 
  Volume2, 
  Maximize, 
  Minimize, 
  Settings, 
  BarChart3, 
  Eye,
  Headphones,
  Camera,
  RotateCcw,
  Zap,
  Play,
  Pause,
  Smartphone,
  Monitor,
  TestTube,
  Cpu,
  Gamepad2,
  Video,
  Film
} from 'lucide-react';
import * as THREE from 'three';

interface CTARendererProps {
  instanceId: string;
  sessionId: string;
  userId?: string;
  onInteraction?: (eventType: string, data?: any) => void;
  onConversion?: (data?: any) => void;
  className?: string;
  developmentMode?: boolean;
  simulationContext?: {
    device?: string;
    persona?: string;
    emotion?: string;
  };
}

interface PersonalizationContext {
  userId?: string;
  sessionId: string;
  deviceCapabilities: {
    webgl?: number;
    webxr?: boolean;
    memory?: number;
    platform?: 'desktop' | 'mobile' | 'vr' | 'ar';
    screenSize?: { width: number; height: number };
    performance?: 'high' | 'medium' | 'low';
    supportedFormats?: string[];
  };
  behaviorData?: {
    dwellTime?: number;
    interactionDepth?: number;
    engagementScore?: number;
    interactionSpeed?: number;
    scrollPattern?: string;
    clickPattern?: string;
    backtrackCount?: number;
  };
  contextData?: {
    pageUrl: string;
    timeOfDay?: number;
    geography?: string;
    language?: string;
    referrer?: string;
    isNewVisitor?: boolean;
    pageViews?: number;
    hasEngaged?: boolean;
    hasAddedToCart?: boolean;
  };
}

interface CTAInstanceData {
  instanceId: string;
  templateId: string;
  name: string;
  status: string;
  placement: any;
  triggers: any;
  customConfig?: any;
}

interface PersonalizationData {
  profile: any;
  personalization: any;
  metadata: any;
}

// 3D Scene Component
const Scene3D: React.FC<{ 
  config: any; 
  onInteraction: (type: string, data?: any) => void;
}> = ({ config, onInteraction }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  const handleClick = () => {
    setClicked(!clicked);
    onInteraction('3d_interaction', { type: 'mesh_click', position: meshRef.current?.position });
  };

  const handlePointerOver = () => {
    setHovered(true);
    onInteraction('3d_hover', { type: 'mesh_hover' });
  };

  const handlePointerOut = () => {
    setHovered(false);
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <mesh
        ref={meshRef}
        scale={clicked ? 1.5 : 1}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color={hovered ? config.ui?.hoverColor || '#ff6b6b' : config.ui?.primaryColor || '#4ecdc4'} 
        />
      </mesh>
      
      {config.content?.title && (
        <Text
          position={[0, 3, 0]}
          fontSize={0.5}
          color={config.ui?.textColor || '#333'}
          anchorX="center"
          anchorY="middle"
        >
          {config.content.title}
        </Text>
      )}
      
      {config.content?.description && (
        <Html
          position={[0, -3, 0]}
          center
          distanceFactor={8}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 max-w-xs text-center shadow-lg">
            <p className="text-sm text-gray-700">{config.content.description}</p>
            <Button 
              className="mt-2 w-full" 
              onClick={() => onInteraction('cta_click', { source: '3d_html' })}
            >
              {config.content?.ctaText || 'Learn More'}
            </Button>
          </div>
        </Html>
      )}
    </>
  );
};

// Enhanced AR Component with WebXR and fallback support
const ARView: React.FC<{ 
  config: any; 
  onInteraction: (type: string, data?: any) => void;
}> = ({ config, onInteraction }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const xrSessionRef = useRef<any>(null);
  const [arSupported, setArSupported] = useState(false);
  const [webXRSupported, setWebXRSupported] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [arMode, setArMode] = useState<'webxr' | 'camera' | 'fallback'>('fallback');
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>({});

  useEffect(() => {
    detectARCapabilities();
  }, []);

  const detectARCapabilities = async () => {
    const capabilities: any = {
      webxr: false,
      camera: false,
      arkit: false,
      arcore: false,
      platform: detectPlatform()
    };

    // Check WebXR support
    if ('xr' in navigator) {
      try {
        const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
        capabilities.webxr = supported;
        setWebXRSupported(supported);
        if (supported) setArMode('webxr');
      } catch (error) {
        console.log('WebXR not supported:', error);
      }
    }

    // Check camera access
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      capabilities.camera = true;
      setArSupported(true);
      if (!capabilities.webxr) setArMode('camera');
    }

    // Detect ARKit/ARCore
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      capabilities.arkit = true;
    } else if (/Android/i.test(userAgent)) {
      capabilities.arcore = true;
    }

    setDeviceCapabilities(capabilities);
    onInteraction('ar_capabilities_detected', capabilities);
  };

  const detectPlatform = () => {
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Android/i.test(userAgent)) return 'android';
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Mac/i.test(userAgent)) return 'macos';
    return 'unknown';
  };

  const startWebXRAR = async () => {
    try {
      if (!webXRSupported) throw new Error('WebXR not supported');
      
      const session = await (navigator as any).xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking', 'hit-test', 'dom-overlay']
      });
      
      xrSessionRef.current = session;
      onInteraction('webxr_session_started', { sessionId: session.id });
      
      // Setup XR rendering loop
      session.requestAnimationFrame(function onXRFrame(time: number, frame: any) {
        // XR rendering logic would go here
        session.requestAnimationFrame(onXRFrame);
      });
      
    } catch (error) {
      console.error('Failed to start WebXR AR:', error);
      // Fallback to camera AR
      await startCameraAR();
    }
  };

  const startCameraAR = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        onInteraction('camera_ar_started');
        
        // Initialize computer vision for marker detection
        initializeMarkerDetection();
      }
    } catch (error) {
      console.error('Failed to start camera AR:', error);
      onInteraction('ar_error', { error: error.message });
    }
  };

  const initializeMarkerDetection = () => {
    // Basic marker detection setup
    // In a real implementation, this would use AR.js or similar library
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const detectMarkers = () => {
        if (ctx && video.readyState === 4) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Marker detection logic would go here
          onInteraction('marker_detection_frame');
        }
        requestAnimationFrame(detectMarkers);
      };
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        detectMarkers();
      });
    }
  };

  const startAR = async () => {
    if (arMode === 'webxr') {
      await startWebXRAR();
    } else if (arMode === 'camera') {
      await startCameraAR();
    } else {
      // Show fallback 3D viewer
      onInteraction('ar_fallback_activated');
    }
  };

  const stopAR = () => {
    if (xrSessionRef.current) {
      xrSessionRef.current.end();
      xrSessionRef.current = null;
      onInteraction('webxr_session_ended');
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraActive(false);
      onInteraction('camera_ar_stopped');
    }
  };

  if (!arSupported && !webXRSupported) {
    return (
      <div className="text-center p-8">
        <Alert>
          <AlertDescription>
            AR is not supported on this device. Showing 3D fallback view instead.
          </AlertDescription>
        </Alert>
        {config.fallback && (
          <div className="mt-4">
            <Scene3D config={config.fallback} onInteraction={onInteraction} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!cameraActive ? (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-500 to-blue-600 text-white p-8">
          <Camera className="w-16 h-16 mb-4" />
          <h3 className="text-2xl font-bold mb-4">AR Experience</h3>
          <p className="text-center mb-6 opacity-90">
            Point your camera at the real world to see {config.content?.title || 'amazing content'}
          </p>
          <Button onClick={startAR} size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
            Start AR Experience
          </Button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
          
          {/* AR Overlay UI */}
          <div className="absolute top-4 left-4 right-4">
            <Card className="bg-white/10 backdrop-blur-md text-white">
              <CardContent className="p-4">
                <h4 className="font-bold text-lg">{config.content?.title}</h4>
                <p className="text-sm opacity-90">{config.content?.description}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* AR Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-2">
              <Button 
                onClick={stopAR}
                size="sm"
                variant="secondary"
                className="bg-white/20 backdrop-blur-sm text-white"
              >
                Stop AR
              </Button>
              <Button 
                onClick={() => onInteraction('ar_cta_click')}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-500"
              >
                {config.content?.ctaText || 'Take Action'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// VR Component (WebXR support)
const VRView: React.FC<{ 
  config: any; 
  onInteraction: (type: string, data?: any) => void;
}> = ({ config, onInteraction }) => {
  const [vrSupported, setVrSupported] = useState(false);
  const [vrSession, setVrSession] = useState<any>(null);

  useEffect(() => {
    // Check for WebXR VR support
    if ('xr' in navigator) {
      (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        setVrSupported(supported);
      });
    }
  }, []);

  const enterVR = async () => {
    try {
      const session = await (navigator as any).xr.requestSession('immersive-vr');
      setVrSession(session);
      onInteraction('vr_entered');
      
      session.addEventListener('end', () => {
        setVrSession(null);
        onInteraction('vr_exited');
      });
    } catch (error) {
      console.error('Failed to enter VR:', error);
      onInteraction('vr_error', { error: error.message });
    }
  };

  if (!vrSupported) {
    return (
      <div className="text-center p-8">
        <Alert>
          <AlertDescription>
            VR is not supported on this device. Please use a VR-capable browser and headset.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8">
      <Headphones className="w-16 h-16 mb-4" />
      <h3 className="text-2xl font-bold mb-4">VR Experience</h3>
      <p className="text-center mb-6 opacity-90">
        {config.content?.description || 'Immerse yourself in a virtual world'}
      </p>
      
      {!vrSession ? (
        <Button onClick={enterVR} size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
          Enter VR
        </Button>
      ) : (
        <div className="text-center">
          <p className="mb-4">VR Session Active</p>
          <Badge variant="secondary">Put on your VR headset</Badge>
        </div>
      )}
    </div>
  );
};

// Performance Monitor Component
const PerformanceMonitor: React.FC<{ 
  visible: boolean; 
  onToggle: () => void;
}> = ({ visible, onToggle }) => {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      // FPS calculation
      let lastTime = performance.now();
      requestAnimationFrame(() => {
        const currentTime = performance.now();
        setFps(Math.round(1000 / (currentTime - lastTime)));
      });

      // Memory usage (if available)
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMemory(Math.round(memInfo.usedJSHeapSize / 1048576)); // MB
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <Card className="absolute top-4 right-4 w-48 bg-black/80 text-white">
      <CardHeader className="p-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Performance
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onToggle}
            className="ml-auto h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-2">
        <div className="flex justify-between text-xs">
          <span>FPS:</span>
          <span className={fps < 30 ? 'text-red-400' : fps < 60 ? 'text-yellow-400' : 'text-green-400'}>
            {fps}
          </span>
        </div>
        {memory > 0 && (
          <div className="flex justify-between text-xs">
            <span>Memory:</span>
            <span>{memory}MB</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Immersive Video Component for 360° and VR video experiences
const ImmersiveVideo: React.FC<{ 
  config: any; 
  onInteraction: (type: string, data?: any) => void;
}> = ({ config, onInteraction }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vrMode, setVrMode] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onInteraction('immersive_video_loaded', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
    };

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => {
      setIsPlaying(true);
      onInteraction('immersive_video_play', { currentTime: video.currentTime });
    };
    const handlePause = () => {
      setIsPlaying(false);
      onInteraction('immersive_video_pause', { currentTime: video.currentTime });
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onInteraction('immersive_video_ended', { duration: video.duration });
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onInteraction]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  };

  const toggleVRMode = () => {
    setVrMode(!vrMode);
    onInteraction('vr_mode_toggle', { vrMode: !vrMode });
  };

  const seekTo = (percentage: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const newTime = (percentage / 100) * duration;
    video.currentTime = newTime;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} className="immersive-video relative bg-black rounded-lg overflow-hidden">
      <div className="relative" style={{ aspectRatio: config.aspectRatio || '16/9' }}>
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${vrMode ? 'transform scale-110 rotate-1' : ''}`}
          src={config.src}
          poster={config.poster}
          loop={config.loop}
          muted={config.muted}
          preload="metadata"
          playsInline
        />

        {/* Video Controls Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          {/* Main Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={togglePlayPause}
              className="bg-black/50 hover:bg-black/70 text-white border-white/20"
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Progress value={progress} className="h-2 cursor-pointer mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={togglePlayPause} className="text-white hover:bg-white/20">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Volume2 className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {config.vrSupported && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleVRMode}
                    className={`text-white hover:bg-white/20 ${vrMode ? 'bg-white/20' : ''}`}
                  >
                    <Headphones className="h-5 w-5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Interactive Hotspots */}
          {config.hotspots?.map((hotspot: any, index: number) => (
            <div
              key={index}
              className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white animate-pulse cursor-pointer hover:scale-110 transition-transform"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                display: currentTime >= hotspot.startTime && currentTime <= hotspot.endTime ? 'block' : 'none'
              }}
              onClick={() => onInteraction('hotspot_click', hotspot)}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {hotspot.label}
              </div>
            </div>
          ))}
        </div>

        {/* Video Type Indicator */}
        <div className="absolute top-4 right-4">
          <Badge variant="outline" className="bg-black/50 text-white border-white/20">
            {config.type === '360' ? '360° Video' : config.type === 'vr' ? 'VR Video' : 'Immersive Video'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Developer Simulation Tools Panel
const DeveloperTools: React.FC<{
  instanceId: string;
  onSimulation: (type: string, data: any) => void;
}> = ({ instanceId, onSimulation }) => {
  const [selectedDevice, setSelectedDevice] = useState('desktop_high');
  const [selectedPersona, setSelectedPersona] = useState('tech_enthusiast');
  const [selectedEmotion, setSelectedEmotion] = useState('high_interest');
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const deviceOptions = [
    { value: 'desktop_high', label: 'Desktop (High-End)', icon: Monitor },
    { value: 'mobile_ios', label: 'iPhone 15 Pro', icon: Smartphone },
    { value: 'mobile_android', label: 'Android Flagship', icon: Smartphone },
    { value: 'vr_quest', label: 'Meta Quest 3', icon: Headphones },
    { value: 'ar_vision', label: 'Apple Vision Pro', icon: Eye }
  ];

  const personaOptions = [
    { value: 'tech_enthusiast', label: 'Tech Enthusiast', description: 'High engagement, explores features' },
    { value: 'casual_browser', label: 'Casual Browser', description: 'Quick scanner, values simplicity' },
    { value: 'researcher', label: 'Detailed Researcher', description: 'Methodical, wants all information' }
  ];

  const emotionOptions = [
    { value: 'high_interest', label: 'High Interest', color: 'bg-green-500' },
    { value: 'urgent_buyer', label: 'Urgent Buyer', color: 'bg-red-500' },
    { value: 'hesitant', label: 'Hesitant', color: 'bg-yellow-500' }
  ];

  const runSimulation = async () => {
    setIsRunningTest(true);
    try {
      const response = await fetch('/api/cta-renderer/developer-tools/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          device: selectedDevice,
          persona: selectedPersona,
          emotion: selectedEmotion
        })
      });
      const results = await response.json();
      setTestResults(results);
      onSimulation('simulation_complete', results);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <Card className="developer-tools mt-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-5 w-5" />
          <span>Developer Simulation Tools</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Simulation */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Device Simulation</Label>
          <div className="grid grid-cols-2 gap-2">
            {deviceOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedDevice === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevice(option.value)}
                className="justify-start"
              >
                <option.icon className="h-4 w-4 mr-2" />
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Persona Simulation */}
        <div>
          <Label className="text-sm font-medium mb-2 block">User Persona</Label>
          <div className="space-y-2">
            {personaOptions.map((option) => (
              <div
                key={option.value}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPersona === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedPersona(option.value)}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Emotion Simulation */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Emotional State</Label>
          <div className="flex flex-wrap gap-2">
            {emotionOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedEmotion === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedEmotion(option.value)}
              >
                <div className={`w-2 h-2 rounded-full ${option.color} mr-2`} />
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Run Simulation */}
        <Button onClick={runSimulation} disabled={isRunningTest} className="w-full">
          {isRunningTest ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Running Simulation...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Run Simulation
            </>
          )}
        </Button>

        {/* Test Results */}
        {testResults && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-2">Simulation Results</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Rendering Pipeline:</span>
                <Badge variant="outline">{testResults.pipeline}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Performance Score:</span>
                <Badge variant={testResults.performanceScore > 80 ? "default" : "secondary"}>
                  {testResults.performanceScore}/100
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main CTA Renderer Component
export const CTARenderer: React.FC<CTARendererProps> = ({
  instanceId,
  sessionId,
  userId,
  onInteraction,
  onConversion,
  className = '',
  developmentMode = false,
  simulationContext
}) => {
  const [renderMode, setRenderMode] = useState<'3d' | 'ar' | 'vr' | 'immersive_video'>('3d');
  const [showDeveloperTools, setShowDeveloperTools] = useState(developmentMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [startTime] = useState(Date.now());
  const [interactionCount, setInteractionCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Advanced device capability detection
  const deviceCapabilities = useMemo(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const webglVersion = gl ? (canvas.getContext('webgl2') ? 2 : 1) : 0;
    
    return {
      webgl: webglVersion,
      webxr: 'xr' in navigator,
      memory: (performance as any).memory?.jsHeapSizeLimit / 1048576 || 4096,
      platform: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' as const : 
                 /VR|Quest|Oculus/.test(navigator.userAgent) ? 'vr' as const : 'desktop' as const,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: navigator.hardwareConcurrency >= 8 ? 'high' as const :
                   navigator.hardwareConcurrency >= 4 ? 'medium' as const : 'low' as const,
      supportedFormats: webglVersion >= 2 ? ['gltf', 'glb', 'fbx'] : ['glb']
    };
  }, []);

  // Advanced behavior tracking for emotion detection
  const [behaviorMetrics, setBehaviorMetrics] = useState({
    mouseMovements: 0,
    clickCount: 0,
    scrollEvents: 0,
    dwellTimeStart: Date.now(),
    lastInteraction: Date.now(),
    rapidClicks: 0,
    backtrackCount: 0
  });

  // Track user behavior for emotion detection
  useEffect(() => {
    const trackMouseMovement = () => {
      setBehaviorMetrics(prev => ({ ...prev, mouseMovements: prev.mouseMovements + 1 }));
    };
    const trackScroll = () => {
      setBehaviorMetrics(prev => ({ ...prev, scrollEvents: prev.scrollEvents + 1 }));
    };
    const trackClick = () => {
      const now = Date.now();
      setBehaviorMetrics(prev => {
        const isRapid = now - prev.lastInteraction < 500;
        return {
          ...prev,
          clickCount: prev.clickCount + 1,
          lastInteraction: now,
          rapidClicks: isRapid ? prev.rapidClicks + 1 : 0
        };
      });
    };

    document.addEventListener('mousemove', trackMouseMovement);
    document.addEventListener('scroll', trackScroll);
    document.addEventListener('click', trackClick);

    return () => {
      document.removeEventListener('mousemove', trackMouseMovement);
      document.removeEventListener('scroll', trackScroll);
      document.removeEventListener('click', trackClick);
    };
  }, []);

  // Create comprehensive personalization context with emotion detection
  const personalizationContext: PersonalizationContext = useMemo(() => {
    const currentTime = Date.now();
    const dwellTime = currentTime - startTime;
    const interactionSpeed = behaviorMetrics.mouseMovements / (dwellTime / 1000);
    
    return {
      userId,
      sessionId,
      deviceCapabilities,
      behaviorData: {
        dwellTime,
        interactionDepth: interactionCount,
        engagementScore: Math.min(interactionCount / 10, 1),
        interactionSpeed,
        scrollPattern: behaviorMetrics.scrollEvents > 10 ? 'fast' : behaviorMetrics.scrollEvents > 3 ? 'normal' : 'slow',
        clickPattern: behaviorMetrics.rapidClicks > 2 ? 'rapid' : 'normal',
        backtrackCount: behaviorMetrics.backtrackCount
      },
      contextData: {
        pageUrl: window.location.href,
        timeOfDay: new Date().getHours(),
        geography: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        referrer: document.referrer,
        isNewVisitor: !localStorage.getItem('returning_visitor'),
        pageViews: parseInt(sessionStorage.getItem('page_views') || '1'),
        hasEngaged: interactionCount > 3,
        hasAddedToCart: localStorage.getItem('cart_items') !== null
      }
    };
  }, [userId, sessionId, deviceCapabilities, startTime, interactionCount, behaviorMetrics]);

  // Fetch CTA instance data
  const { data: instanceData, isLoading: instanceLoading, error: instanceError } = useQuery<CTAInstanceData>({
    queryKey: ['cta-instance', instanceId],
    queryFn: async () => {
      const response = await fetch(`/api/cta-renderer/instances/${instanceId}`);
      if (!response.ok) throw new Error('Failed to fetch CTA instance');
      const result = await response.json();
      return result.data;
    }
  });

  // Fetch advanced emotion-aware rendering configuration
  const { data: renderConfig, isLoading: renderLoading } = useQuery({
    queryKey: ['cta-render-advanced', instanceId, sessionId, behaviorMetrics.clickCount],
    queryFn: async () => {
      const response = await fetch(`/api/cta-renderer/render-advanced/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalizationContext)
      });
      if (!response.ok) throw new Error('Failed to get advanced render config');
      const result = await response.json();
      return result.data;
    },
    enabled: !!instanceData,
    refetchInterval: 30000, // Re-fetch every 30 seconds for real-time adaptation
    staleTime: 10000 // Consider data stale after 10 seconds
  });

  // Fetch personalized configuration (fallback)
  const { data: personalizationData, isLoading: personalizationLoading } = useQuery<PersonalizationData>({
    queryKey: ['cta-personalization', instanceId, sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/cta-renderer/personalize/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalizationContext)
      });
      if (!response.ok) throw new Error('Failed to get personalization');
      const result = await response.json();
      return result.data;
    },
    enabled: !!instanceData && !renderConfig
  });

  // Track analytics events
  const trackEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/cta-renderer/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId,
          sessionId,
          userId,
          dwellTime: Date.now() - startTime,
          deviceInfo: deviceCapabilities,
          ...eventData
        })
      });
      if (!response.ok) throw new Error('Failed to track event');
      return response.json();
    }
  });

  // Enhanced interaction handling with emotion tracking
  const handleInteraction = useCallback((eventType: string, data?: any) => {
    setInteractionCount(prev => prev + 1);
    
    // Update behavior metrics for emotion detection
    if (eventType === 'backtrack') {
      setBehaviorMetrics(prev => ({ ...prev, backtrackCount: prev.backtrackCount + 1 }));
    }
    
    // Track advanced analytics with emotion context
    trackEventMutation.mutate({
      eventType: eventType === 'cta_click' ? 'conversion' : 'interaction',
      interactionData: { 
        type: eventType, 
        emotionContext: renderConfig?.emotionAnalysis,
        personaVector: renderConfig?.personaVector,
        renderingStrategy: renderConfig?.renderingStrategy?.primary,
        ...data 
      }
    });

    // Call parent handler
    onInteraction?.(eventType, data);

    // Handle conversions
    if (eventType === 'cta_click' || eventType === 'conversion') {
      onConversion?.(data);
      toast({
        title: "Success!",
        description: "Thank you for your interest. We'll be in touch soon.",
      });
    }
  }, [trackEventMutation, onInteraction, onConversion, renderConfig, toast]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle render mode change
  const changeRenderMode = (mode: '3d' | 'ar' | 'vr') => {
    setRenderMode(mode);
    handleInteraction('mode_change', { mode });
  };

  // Track impression on mount
  useEffect(() => {
    handleInteraction('impression');
    
    // Mark as returning visitor
    localStorage.setItem('returning_visitor', 'true');
    
    // Track page views
    const currentViews = parseInt(sessionStorage.getItem('page_views') || '0');
    sessionStorage.setItem('page_views', (currentViews + 1).toString());
  }, []);

  // Apply simulation context if in development mode
  useEffect(() => {
    if (simulationContext && developmentMode) {
      // Override device capabilities for simulation
      if (simulationContext.device) {
        // This would normally override deviceCapabilities in a more sophisticated implementation
        console.log('🧪 Simulating device:', simulationContext.device);
      }
    }
  }, [simulationContext, developmentMode]);

  const isLoading = instanceLoading || renderLoading || personalizationLoading;

  if (instanceError) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load CTA content. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <CardContent className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading immersive experience...</p>
        </CardContent>
      </Card>
    );
  }

  // Use advanced config if available, fallback to basic personalization
  const config = renderConfig || personalizationData?.config || instanceData?.customConfig || {};
  const emotionData = renderConfig?.emotionAnalysis;
  const adaptations = renderConfig?.adaptations || personalizationData?.adaptations || {};

  return (
    <div 
      ref={containerRef}
      className={`cta-renderer relative w-full h-full ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
    >
      {/* Main Rendering Content */}
      <div className="relative w-full h-full min-h-[500px]">
        {renderMode === '3d' && (
          <Scene3D 
            config={{
              ...config,
              adaptations,
              emotionContext: emotionData
            }}
            onInteraction={handleInteraction}
          />
        )}
        
        {renderMode === 'ar' && (
          <ARView 
            config={{
              ...config,
              adaptations,
              emotionContext: emotionData
            }}
            onInteraction={handleInteraction}
          />
        )}
        
        {renderMode === 'vr' && (
          <VRView 
            config={{
              ...config,
              adaptations,
              emotionContext: emotionData
            }}
            onInteraction={handleInteraction}
          />
        )}

        {renderMode === 'immersive_video' && (
          <ImmersiveVideo 
            config={{
              ...config,
              adaptations,
              emotionContext: emotionData
            }}
            onInteraction={handleInteraction}
          />
        )}

        {/* Control Panel */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Mode Selector */}
          <Card className="bg-white/10 backdrop-blur-md">
            <CardContent className="p-2">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={renderMode === '3d' ? 'default' : 'ghost'}
                  onClick={() => changeRenderMode('3d')}
                  className="text-xs"
                >
                  3D
                </Button>
                <Button
                  size="sm"
                  variant={renderMode === 'ar' ? 'default' : 'ghost'}
                  onClick={() => changeRenderMode('ar')}
                  className="text-xs"
                >
                  AR
                </Button>
                <Button
                  size="sm"
                  variant={renderMode === 'vr' ? 'default' : 'ghost'}
                  onClick={() => changeRenderMode('vr')}
                  className="text-xs"
                >
                  VR
                </Button>
                {config.video && (
                  <Button
                    size="sm"
                    variant={renderMode === 'immersive_video' ? 'default' : 'ghost'}
                    onClick={() => setRenderMode('immersive_video')}
                    className="text-xs"
                  >
                    <Film className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emotion & Personalization Indicator */}
          {emotionData && (
            <Card className="bg-white/10 backdrop-blur-md">
              <CardContent className="p-2">
                <div className="text-xs text-white">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span>Emotion: {emotionData.dominant}</span>
                  </div>
                  <div className="text-xs opacity-75">
                    Confidence: {Math.round(emotionData.confidence * 100)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Control Bar */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="bg-white/20 backdrop-blur-sm"
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowPerformance(!showPerformance)}
            className="bg-white/20 backdrop-blur-sm"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          
          {developmentMode && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowDeveloperTools(!showDeveloperTools)}
              className="bg-white/20 backdrop-blur-sm"
            >
              <TestTube className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleFullscreen}
            className="bg-white/20 backdrop-blur-sm"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>

        {/* Performance Monitor */}
        <PerformanceMonitor 
          visible={showPerformance}
          onToggle={() => setShowPerformance(false)}
        />

        {/* Advanced Personalization Badge */}
        {(adaptations?.personalizedElements?.length > 0 || emotionData) && (
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-purple-600/80 text-white">
              <Zap className="h-3 w-3 mr-1" />
              AI Personalized
            </Badge>
          </div>
        )}
      </div>

      {/* Developer Tools Panel */}
      {showDeveloperTools && developmentMode && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white border-l shadow-lg overflow-y-auto">
          <DeveloperTools 
            instanceId={instanceId}
            onSimulation={(type, data) => {
              console.log('🧪 Simulation result:', type, data);
              toast({
                title: "Simulation Complete",
                description: `${type} completed with score: ${data.performanceScore}/100`
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CTARenderer;