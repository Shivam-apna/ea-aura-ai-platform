import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { HolographicCard } from './Dashboard'; // Reusing HolographicCard from Dashboard

const Security = () => {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 h-full bg-background"> {/* Apply background to the page */}
      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Threat Monitoring {/* Changed text-green-400 to text-primary */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Real-time monitoring of potential security threats.</p>
          <p className="text-sm text-muted-foreground mt-2">Active threat detection and prevention systems.</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" /> Incident Response {/* Changed text-red-400 to text-primary */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Protocols and tools for rapid incident response.</p>
          <p className="text-sm text-muted-foreground mt-2">Minimize impact of security breaches.</p>
        </CardContent>
      </HolographicCard>

      <HolographicCard className="md:col-span-2 neumorphic-card"> {/* Apply neumorphic styling */}
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Access Control {/* Changed text-blue-400 to text-primary */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">Manage user roles and permissions securely.</p>
          <p className="text-sm text-muted-foreground mt-2">Ensure data integrity and confidentiality.</p>
        </CardContent>
      </HolographicCard>
    </div>
  );
};

export default Security;