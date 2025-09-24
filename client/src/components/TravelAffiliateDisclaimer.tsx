import { AlertTriangle, ExternalLink, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TravelAffiliateDisclaimerProps {
  variant?: "banner" | "inline" | "tooltip";
  context?: "offers" | "reviews" | "general";
  className?: string;
}

export function TravelAffiliateDisclaimer({ 
  variant = "inline", 
  context = "general",
  className = "" 
}: TravelAffiliateDisclaimerProps) {
  
  const getDisclaimerText = () => {
    switch (context) {
      case "offers":
        return "This page contains affiliate links. When you book through our partners, we may earn a commission at no additional cost to you. This helps us provide free travel content and maintain our platform.";
      case "reviews":
        return "Some recommendations include affiliate links to trusted travel providers. Our reviews remain independent and honest, based on real travel experiences and expert research.";
      default:
        return "We partner with trusted travel companies and may earn commissions from qualifying purchases. This supports our mission to provide free, comprehensive travel guidance.";
    }
  };

  const getBadgeText = () => {
    switch (context) {
      case "offers":
        return "Affiliate Partnership";
      case "reviews":
        return "Contains Affiliate Links";
      default:
        return "Sponsored Content";
    }
  };

  if (variant === "banner") {
    return (
      <Alert className={`border-orange-200 bg-orange-50 dark:bg-orange-900/20 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Affiliate Disclosure:</strong> {getDisclaimerText()}
          <span className="block mt-2 text-sm">
            Our editorial integrity is never compromised by financial relationships. 
            We only recommend products and services we genuinely believe will benefit travelers.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "tooltip") {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Info className="h-3 w-3 mr-1" />
        {getBadgeText()}
      </Badge>
    );
  }

  // Default inline variant
  return (
    <Card className={`border-blue-200 bg-blue-50 dark:bg-blue-900/20 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Transparency Notice
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              {getDisclaimerText()}
            </p>
            <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
              <span className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                FTC Compliant
              </span>
              <span>•</span>
              <span>GDPR Compliant</span>
              <span>•</span>
              <span>Editorial Independence</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Specific disclaimers for different sections
export function TravelOfferDisclaimer({ className = "" }: { className?: string }) {
  return (
    <TravelAffiliateDisclaimer 
      variant="banner"
      context="offers"
      className={className}
    />
  );
}

export function TravelReviewDisclaimer({ className = "" }: { className?: string }) {
  return (
    <TravelAffiliateDisclaimer 
      variant="inline"
      context="reviews"
      className={className}
    />
  );
}

export function TravelAffiliateBadge({ className = "" }: { className?: string }) {
  return (
    <TravelAffiliateDisclaimer 
      variant="tooltip"
      context="offers"
      className={className}
    />
  );
}