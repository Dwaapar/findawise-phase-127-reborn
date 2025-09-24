/**
 * Layout Mutation Renderer Component
 * Billion-Dollar Empire Grade - Real-time layout rendering with drag-drop and mutation support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggable, useDroppable, DndContext, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface LayoutElement {
  id: string;
  type: 'header' | 'hero' | 'cta' | 'content' | 'sidebar' | 'footer' | 'form' | 'image' | 'video';
  position: { x: number; y: number; width: number; height: number };
  content: any;
  style: any;
  interactive: boolean;
  priority: number;
}

interface PersonalizedLayout {
  layoutId: string;
  instanceId: string;
  elements: LayoutElement[];
  metadata: {
    generatedAt: Date;
    mutationRules: string[];
    personalizedFor: string;
    confidenceScore: number;
  };
}

interface LayoutMutationRendererProps {
  templateId: string;
  sessionId: string;
  userId?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  enableDragDrop?: boolean;
  onMutation?: (mutation: any) => void;
  onPersonalization?: (personalization: any) => void;
  className?: string;
}

export const LayoutMutationRenderer: React.FC<LayoutMutationRendererProps> = ({
  templateId,
  sessionId,
  userId,
  deviceType,
  enableDragDrop = false,
  onMutation,
  onPersonalization,
  className = ''
}) => {
  const [layout, setLayout] = useState<PersonalizedLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mutations, setMutations] = useState<any[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate initial personalized layout
  useEffect(() => {
    generateLayout();
  }, [templateId, sessionId, deviceType]);

  // Set up real-time mutation stream
  useEffect(() => {
    if (layout?.instanceId) {
      setupMutationStream(layout.instanceId);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [layout?.instanceId]);

  // Track user behavior for mutations
  useEffect(() => {
    if (layout?.instanceId) {
      setupBehaviorTracking();
    }
  }, [layout?.instanceId]);

  const generateLayout = async () => {
    try {
      setIsLoading(true);
      
      const context = {
        sessionId,
        userId,
        deviceType,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userAgent: navigator.userAgent,
        location: window.location.href,
        referrer: document.referrer,
        timeOfDay: new Date().getHours(),
        behaviorProfile: getBehaviorProfile(),
        conversionHistory: getConversionHistory()
      };

      const response = await fetch('/api/layout-mutation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate layout');
      }

      const result = await response.json();
      setLayout(result.data);
      
    } catch (error) {
      console.error('Error generating layout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupMutationStream = (instanceId: string) => {
    eventSourceRef.current = new EventSource(`/api/layout-mutation/events/${instanceId}/stream`);
    
    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'layout_mutated') {
          handleRealTimeMutation(data.mutations);
        }
      } catch (error) {
        console.error('Error processing mutation event:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('EventSource error:', error);
    };
  };

  const setupBehaviorTracking = () => {
    const trackBehavior = (behaviorData: any) => {
      if (layout?.instanceId) {
        fetch(`/api/layout-mutation/mutate/${layout.instanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            behaviorData,
            immediate: false
          })
        }).catch(error => {
          console.error('Error tracking behavior:', error);
        });
      }
    };

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        trackBehavior({
          type: 'scroll',
          position: window.scrollY,
          percentage: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100,
          timestamp: Date.now()
        });
      }, 1000);
    };

    // Track clicks
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      trackBehavior({
        type: 'click',
        elementId: target.id || target.className,
        position: { x: event.clientX, y: event.clientY },
        timestamp: Date.now()
      });
    };

    // Track mouse movement (throttled)
    let mouseTimeout: NodeJS.Timeout;
    const handleMouseMove = (event: MouseEvent) => {
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        trackBehavior({
          type: 'mouse_move',
          position: { x: event.clientX, y: event.clientY },
          timestamp: Date.now()
        });
      }, 2000);
    };

    // Track time spent on elements
    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      trackBehavior({
        type: 'element_focus',
        elementId: target.id || target.className,
        timestamp: Date.now()
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      clearTimeout(scrollTimeout);
      clearTimeout(mouseTimeout);
    };
  };

  const handleRealTimeMutation = (newMutations: any[]) => {
    setMutations(prev => [...prev, ...newMutations]);
    
    // Apply mutations to layout elements
    setLayout(prevLayout => {
      if (!prevLayout) return prevLayout;
      
      const updatedElements = prevLayout.elements.map(element => {
        const elementMutations = newMutations.filter(m => m.elementId === element.id);
        
        let updatedElement = { ...element };
        
        elementMutations.forEach(mutation => {
          switch (mutation.action) {
            case 'move':
              updatedElement.position = { ...updatedElement.position, ...mutation.targetValue };
              break;
            case 'style':
              updatedElement.style = { ...updatedElement.style, ...mutation.targetValue };
              break;
            case 'content':
              updatedElement.content = { ...updatedElement.content, ...mutation.targetValue };
              break;
            case 'hide':
              updatedElement.style = { ...updatedElement.style, display: 'none' };
              break;
            case 'show':
              updatedElement.style = { ...updatedElement.style, display: 'block' };
              break;
          }
        });
        
        return updatedElement;
      });
      
      return {
        ...prevLayout,
        elements: updatedElements
      };
    });

    // Notify parent component
    if (onMutation) {
      onMutation(newMutations);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    
    if (!layout?.instanceId || !enableDragDrop) return;

    const elementId = active.id as string;
    const element = layout.elements.find(e => e.id === elementId);
    
    if (!element) return;

    const newPosition = {
      x: element.position.x + delta.x,
      y: element.position.y + delta.y,
      width: element.position.width,
      height: element.position.height
    };

    try {
      const response = await fetch(`/api/layout-mutation/personalize/${layout.instanceId}/drag-drop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          elementId,
          newPosition,
          userId
        })
      });

      if (response.ok) {
        // Update local state
        setLayout(prevLayout => {
          if (!prevLayout) return prevLayout;
          
          const updatedElements = prevLayout.elements.map(el => 
            el.id === elementId 
              ? { ...el, position: newPosition }
              : el
          );
          
          return {
            ...prevLayout,
            elements: updatedElements
          };
        });

        // Notify parent component
        if (onPersonalization) {
          onPersonalization({ elementId, newPosition, userId });
        }
      }
    } catch (error) {
      console.error('Error handling drag-drop:', error);
    }
  };

  const getBehaviorProfile = () => {
    // Get stored behavior profile or create new one
    const stored = localStorage.getItem(`behavior_profile_${sessionId}`);
    return stored ? JSON.parse(stored) : {};
  };

  const getConversionHistory = () => {
    // Get user's conversion history
    const stored = localStorage.getItem(`conversion_history_${userId || sessionId}`);
    return stored ? JSON.parse(stored) : [];
  };

  if (isLoading) {
    return (
      <div className={`layout-loading ${className}`}>
        <div className="loading-spinner"></div>
        <p>Generating personalized layout...</p>
      </div>
    );
  }

  if (!layout) {
    return (
      <div className={`layout-error ${className}`}>
        <p>Failed to load layout. Please try again.</p>
        <button onClick={generateLayout}>Retry</button>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div 
        ref={containerRef}
        className={`layout-container ${className} device-${deviceType}`}
        data-instance-id={layout.instanceId}
        data-confidence={layout.metadata.confidenceScore}
      >
        {layout.elements
          .sort((a, b) => a.priority - b.priority)
          .map(element => (
            <LayoutElement
              key={element.id}
              element={element}
              enableDragDrop={enableDragDrop && element.interactive}
              deviceType={deviceType}
            />
          ))}
        
        {/* Layout metadata for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="layout-debug-info">
            <p>Instance: {layout.instanceId}</p>
            <p>Confidence: {layout.metadata.confidenceScore}</p>
            <p>Rules Applied: {layout.metadata.mutationRules.length}</p>
            <p>Mutations: {mutations.length}</p>
          </div>
        )}
      </div>
    </DndContext>
  );
};

// Individual layout element component
interface LayoutElementProps {
  element: LayoutElement;
  enableDragDrop: boolean;
  deviceType: string;
}

const LayoutElement: React.FC<LayoutElementProps> = ({
  element,
  enableDragDrop,
  deviceType
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: element.id,
    disabled: !enableDragDrop
  });

  const style = {
    ...element.style,
    position: 'absolute' as const,
    left: element.position.x,
    top: element.position.y,
    width: element.position.width,
    height: element.position.height,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : element.priority,
    cursor: enableDragDrop ? 'grab' : 'default'
  };

  const renderContent = () => {
    switch (element.type) {
      case 'header':
        return (
          <header className="layout-header">
            <h1>{element.content.title}</h1>
            {element.content.subtitle && <p>{element.content.subtitle}</p>}
          </header>
        );

      case 'hero':
        return (
          <section className="layout-hero">
            <h1>{element.content.headline}</h1>
            <p>{element.content.subtext}</p>
            {element.content.cta && (
              <button className="hero-cta">{element.content.cta}</button>
            )}
          </section>
        );

      case 'cta':
        return (
          <button 
            className="layout-cta"
            onClick={() => window.location.href = element.content.link || '#'}
          >
            {element.content.text}
          </button>
        );

      case 'content':
        return (
          <div className="layout-content">
            {element.content.title && <h2>{element.content.title}</h2>}
            <div dangerouslySetInnerHTML={{ __html: element.content.html || element.content.text }} />
          </div>
        );

      case 'image':
        return (
          <img 
            src={element.content.src}
            alt={element.content.alt || ''}
            className="layout-image"
          />
        );

      case 'video':
        return (
          <video 
            src={element.content.src}
            controls={element.content.controls !== false}
            autoPlay={element.content.autoPlay}
            className="layout-video"
          />
        );

      case 'form':
        return (
          <form className="layout-form">
            {element.content.fields?.map((field: any, index: number) => (
              <div key={index} className="form-field">
                <label>{field.label}</label>
                <input 
                  type={field.type || 'text'}
                  name={field.name}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </div>
            ))}
            <button type="submit">{element.content.submitText || 'Submit'}</button>
          </form>
        );

      default:
        return (
          <div className={`layout-${element.type}`}>
            {JSON.stringify(element.content)}
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layout-element layout-element-${element.type} ${isDragging ? 'dragging' : ''}`}
      data-element-id={element.id}
      {...attributes}
      {...listeners}
    >
      {renderContent()}
      
      {enableDragDrop && (
        <div className="drag-handle">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <circle cx="3" cy="3" r="1" />
            <circle cx="9" cy="3" r="1" />
            <circle cx="3" cy="9" r="1" />
            <circle cx="9" cy="9" r="1" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LayoutMutationRenderer;