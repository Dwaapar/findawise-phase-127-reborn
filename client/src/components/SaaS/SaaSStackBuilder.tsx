import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { 
  Plus, 
  Trash2, 
  Download, 
  Mail, 
  Calculator,
  Star,
  DollarSign,
  Users,
  TrendingUp,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { saasCategories } from "@/config/saasConfig";

interface StackTool {
  id: string;
  name: string;
  category: string;
  pricing: {
    monthly: number;
    yearly: number;
  };
  description: string;
  rating: number;
  logo: string;
}

interface SaaSStackBuilderProps {
  onStackSave?: (stack: any) => void;
  initialStack?: StackTool[];
}

export default function SaaSStackBuilder({ onStackSave, initialStack = [] }: SaaSStackBuilderProps) {
  const [selectedTools, setSelectedTools] = useState<StackTool[]>(initialStack);
  const [availableTools, setAvailableTools] = useState<StackTool[]>([]);
  const [stackName, setStackName] = useState("");
  const [stackDescription, setStackDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  // Sample tools data - in production, this would come from API
  const sampleTools: StackTool[] = [
    {
      id: "notion",
      name: "Notion",
      category: "productivity",
      pricing: { monthly: 8, yearly: 96 },
      description: "All-in-one workspace for notes, docs, and collaboration",
      rating: 4.7,
      logo: "/logos/notion.png"
    },
    {
      id: "slack",
      name: "Slack",
      category: "communication",
      pricing: { monthly: 7.25, yearly: 87 },
      description: "Team communication and collaboration platform",
      rating: 4.5,
      logo: "/logos/slack.png"
    },
    {
      id: "hubspot",
      name: "HubSpot CRM",
      category: "crm",
      pricing: { monthly: 45, yearly: 540 },
      description: "Comprehensive CRM and marketing automation",
      rating: 4.6,
      logo: "/logos/hubspot.png"
    },
    {
      id: "figma",
      name: "Figma",
      category: "design",
      pricing: { monthly: 12, yearly: 144 },
      description: "Collaborative interface design tool",
      rating: 4.8,
      logo: "/logos/figma.png"
    },
    {
      id: "zapier",
      name: "Zapier",
      category: "ai-tools",
      pricing: { monthly: 19.99, yearly: 239.88 },
      description: "Automation platform connecting apps and services",
      rating: 4.4,
      logo: "/logos/zapier.png"
    },
    {
      id: "quickbooks",
      name: "QuickBooks",
      category: "finance",
      pricing: { monthly: 25, yearly: 300 },
      description: "Accounting and financial management software",
      rating: 4.3,
      logo: "/logos/quickbooks.png"
    }
  ];

  useEffect(() => {
    setAvailableTools(sampleTools.filter(tool => 
      !selectedTools.some(selected => selected.id === tool.id)
    ));
  }, [selectedTools]);

  const filteredTools = availableTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateTotalCost = () => {
    const monthly = selectedTools.reduce((sum, tool) => sum + tool.pricing.monthly, 0);
    const yearly = selectedTools.reduce((sum, tool) => sum + tool.pricing.yearly, 0);
    return { monthly, yearly };
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === "available" && destination.droppableId === "selected") {
      const tool = filteredTools[source.index];
      setSelectedTools(prev => [...prev, tool]);
    } else if (source.droppableId === "selected" && destination.droppableId === "available") {
      const newSelectedTools = [...selectedTools];
      newSelectedTools.splice(source.index, 1);
      setSelectedTools(newSelectedTools);
    } else if (source.droppableId === "selected" && destination.droppableId === "selected") {
      const newSelectedTools = [...selectedTools];
      const [removed] = newSelectedTools.splice(source.index, 1);
      newSelectedTools.splice(destination.index, 0, removed);
      setSelectedTools(newSelectedTools);
    }
  };

  const addTool = (tool: StackTool) => {
    if (!selectedTools.some(selected => selected.id === tool.id)) {
      setSelectedTools(prev => [...prev, tool]);
    }
  };

  const removeTool = (toolId: string) => {
    setSelectedTools(prev => prev.filter(tool => tool.id !== toolId));
  };

  const handleDownloadStack = () => {
    if (selectedTools.length === 0) {
      toast({
        title: "Empty Stack",
        description: "Please add some tools to your stack first.",
        variant: "destructive",
      });
      return;
    }

    const stackData = {
      name: stackName || "My SaaS Stack",
      description: stackDescription,
      tools: selectedTools,
      totalCost: calculateTotalCost(),
      createdAt: new Date().toISOString(),
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(stackData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stackName || 'saas-stack'}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Stack Downloaded!",
      description: "Your SaaS stack has been saved to your downloads.",
    });
  };

  const handleEmailCapture = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // In production, this would send the stack via email
    toast({
      title: "Stack Sent!",
      description: `Your SaaS stack has been sent to ${email}`,
    });
    setShowEmailCapture(false);
    setEmail("");
  };

  const totalCost = calculateTotalCost();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          SaaS Stack Builder
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Build your perfect software stack with drag-and-drop simplicity. 
          Compare costs, features, and get personalized recommendations.
        </p>
      </motion.div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Tools */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Available Tools
                </CardTitle>
                <CardDescription>
                  Search and filter tools, then drag them to your stack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <Input
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  >
                    <option value="all">All Categories</option>
                    {saasCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Droppable droppableId="available" direction="vertical">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-3 p-4 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {filteredTools.map((tool, index) => (
                        <Draggable key={tool.id} draggableId={tool.id} index={index}>
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              whileHover={{ scale: 1.02 }}
                              className={`p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing transition-shadow ${
                                snapshot.isDragging ? "shadow-lg rotate-2" : "hover:shadow-md"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                                    {tool.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                      {tool.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      {tool.rating}
                                      <span>•</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {saasCategories.find(c => c.id === tool.category)?.name}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                                    ${tool.pricing.monthly}/mo
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => addTool(tool)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                {tool.description}
                              </p>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {filteredTools.length === 0 && (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          No tools found matching your criteria
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>

          {/* Stack Builder */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Your Stack ({selectedTools.length})
                </CardTitle>
                <CardDescription>
                  Drag tools here to build your stack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="selected" direction="vertical">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[300px] space-y-3 p-4 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver 
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selectedTools.map((tool, index) => (
                        <Draggable key={tool.id} draggableId={`selected-${tool.id}`} index={index}>
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? "shadow-lg rotate-1" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {tool.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                      {tool.name}
                                    </h4>
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                      ${tool.pricing.monthly}/mo
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeTool(tool.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {selectedTools.length === 0 && (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Drop tools here to build your stack</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>

                {/* Cost Summary */}
                {selectedTools.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Total Cost
                      </span>
                      <div className="text-right">
                        <div className="font-bold text-lg text-slate-900 dark:text-slate-100">
                          ${totalCost.monthly.toFixed(2)}/mo
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          ${totalCost.yearly.toFixed(2)}/year
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Save ${(totalCost.monthly * 12 - totalCost.yearly).toFixed(2)} with annual billing
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Stack Details */}
            {selectedTools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Stack Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="stackName">Stack Name</Label>
                    <Input
                      id="stackName"
                      placeholder="e.g., Startup Essentials"
                      value={stackName}
                      onChange={(e) => setStackName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stackDescription">Description</Label>
                    <Textarea
                      id="stackDescription"
                      placeholder="Describe your stack and use case..."
                      value={stackDescription}
                      onChange={(e) => setStackDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Button onClick={handleDownloadStack} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Stack
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowEmailCapture(true)}
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Stack
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DragDropContext>

      {/* Email Capture Modal */}
      <AnimatePresence>
        {showEmailCapture && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEmailCapture(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Email Your Stack</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEmailCapture} className="flex-1">
                    Send Stack
                  </Button>
                  <Button variant="outline" onClick={() => setShowEmailCapture(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}