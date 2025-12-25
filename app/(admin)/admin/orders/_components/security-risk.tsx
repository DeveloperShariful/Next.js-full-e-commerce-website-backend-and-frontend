// File Location: app/admin/orders/_components/security-risk.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Globe, Monitor } from "lucide-react";

export const SecurityRisk = ({ order }: { order: any }) => {
  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return "bg-red-100 text-red-700 border-red-200";
      case 'medium': return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-green-100 text-green-700 border-green-200";
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
          {order.riskLevel === 'high' ? <ShieldAlert size={14} className="text-red-500"/> : <ShieldCheck size={14}/>}
          Fraud Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        
        <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Risk Level</span>
            <Badge variant="outline" className={`uppercase ${getRiskColor(order.riskLevel || 'low')}`}>
                {order.riskLevel || "Low"}
            </Badge>
        </div>

        {order.riskScore && (
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Risk Score</span>
                <span className="font-mono text-sm font-bold">{order.riskScore}/100</span>
            </div>
        )}

        <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
                <Globe size={12} className="text-slate-400"/>
                <span className="font-medium">IP Address:</span>
                <span className="font-mono bg-slate-100 px-1 rounded">{order.ipAddress || "Unknown"}</span>
            </div>
            
            {order.userAgent && (
                <div className="flex items-start gap-2 text-xs text-slate-600">
                    <Monitor size={12} className="text-slate-400 mt-0.5 shrink-0"/>
                    <span className="break-all line-clamp-2" title={order.userAgent}>
                        {order.userAgent}
                    </span>
                </div>
            )}
        </div>

      </CardContent>
    </Card>
  );
};