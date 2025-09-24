import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  BarChart3, 
  FileText, 
  FlaskConical, 
  Mail, 
  Smartphone, 
  Globe, 
  Settings, 
  Brain,
  Users,
  TrendingUp,
  Database,
  Zap,
  Target,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Server
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AdminSidebarProps {
  className?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ className = "" }) => {
  const [location] = useLocation();
  const { translate } = useTranslation();
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    analytics: true,
    management: true,
    automation: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path: string) => location === path;

  const sidebarSections = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        { 
          path: '/admin', 
          icon: BarChart3, 
          label: translate ? translate('nav.dashboard', {}, 'Dashboard') : 'Dashboard' 
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Insights',
      collapsible: true,
      items: [
        { 
          path: '/admin/analytics', 
          icon: TrendingUp, 
          label: 'Analytics Overview' 
        },
        { 
          path: '/admin/cross-device-analytics', 
          icon: Smartphone, 
          label: 'Cross-Device Analytics' 
        },
        { 
          path: '/admin/user-insights', 
          icon: Users, 
          label: 'User Insights' 
        }
      ]
    },
    {
      id: 'management',
      title: 'Content & Testing',
      collapsible: true,
      items: [
        { 
          path: '/admin/affiliate-dashboard', 
          icon: Target, 
          label: 'Affiliate Management' 
        },
        { 
          path: '/admin/experiments-dashboard', 
          icon: FlaskConical, 
          label: 'A/B Testing' 
        },
        { 
          path: '/admin/leads-dashboard', 
          icon: Mail, 
          label: 'Lead Management' 
        },
        { 
          path: '/admin/localization', 
          icon: Globe, 
          label: translate ? translate('nav.localization', {}, 'Localization') : 'Localization' 
        },
        { 
          path: '/admin/interactive-modules', 
          icon: Zap, 
          label: 'Interactive Modules' 
        },
        { 
          path: '/admin/funnel-dashboard', 
          icon: GitBranch, 
          label: 'Funnel Engine' 
        },
        { 
          path: '/admin/deployment-dashboard', 
          icon: Server, 
          label: 'Deployment Center' 
        }
      ]
    },
    {
      id: 'automation',
      title: 'AI & Automation',
      collapsible: true,
      items: [
        { 
          path: '/admin/ai-dashboard', 
          icon: Brain, 
          label: 'AI Orchestrator' 
        },
        { 
          path: '/admin/orchestrator-dashboard', 
          icon: Zap, 
          label: 'Automation Runs' 
        },
        { 
          path: '/admin/knowledge-memory', 
          icon: Brain, 
          label: 'Knowledge Memory' 
        }
      ]
    },
    {
      id: 'system',
      title: 'System & Configuration',
      collapsible: true,
      items: [
        { 
          path: '/admin/configuration', 
          icon: Settings, 
          label: 'Configuration' 
        },
        { 
          path: '/admin/data-management', 
          icon: Database, 
          label: 'Data Management' 
        }
      ]
    }
  ];

  return (
    <div className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl border-r border-gray-200 z-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h1 className="text-xl font-bold text-gray-800">Findawise Empire</h1>
        <p className="text-sm text-gray-600 mt-1">Affiliate Management System</p>
      </div>
      
      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          {sidebarSections.map((section) => (
            <div key={section.id} className="space-y-2">
              {section.collapsible ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                >
                  <span>{section.title}</span>
                  {expandedSections[section.id] ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                </button>
              ) : (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              
              {(!section.collapsible || expandedSections[section.id]) && (
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <li key={item.path}>
                        <Link href={item.path}>
                          <div className={`
                            flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 cursor-pointer
                            ${active 
                              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 font-medium shadow-sm' 
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}>
                            <Icon className={`w-5 h-5 mr-3 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>Findawise Empire v2.0</p>
          <p className="mt-1">AI-Powered Management</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;