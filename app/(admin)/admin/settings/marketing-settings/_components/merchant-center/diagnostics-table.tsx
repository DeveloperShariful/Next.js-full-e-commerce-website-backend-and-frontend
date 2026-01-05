//app/(admin)/admin/settings/marketing-settings/_components/merchant-center/diagnostics-table.tsx
"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { getMerchantDiagnostics } from "@/app/actions/admin/settings/marketing-settings/merchant_center/get-diagnostics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MerchantDiagnosticsTable() {
  const [issues, setIssues] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagnostics = async () => {
        const result = await getMerchantDiagnostics();
        if (result.success) {
            setIssues(result);
        }
        setLoading(false);
    };
    fetchDiagnostics();
  }, []);

  if (loading) return <div className="py-4 text-center text-sm text-muted-foreground">Checking diagnostics...</div>;

  const productIssues = issues?.productIssues || [];
  const accountIssues = issues?.accountIssues || [];

  return (
    <div className="space-y-6 max-w-[100vw] overflow-hidden">
      {/* Account Level Alerts */}
      {accountIssues.length > 0 && (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Warning</AlertTitle>
            <AlertDescription>
                {accountIssues.map((issue: any, i: number) => (
                    <div key={i}>{issue.title}: {issue.detail}</div>
                ))}
            </AlertDescription>
        </Alert>
      )}

      {/* Product Issues Table */}
      <div className="rounded-md border bg-white">
        <div className="p-4 border-b bg-slate-50">
            <h3 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Product Issues ({productIssues.length})
            </h3>
        </div>
        
        {/* ✅ FIX: Scroll Wrapper for Table */}
        <div className="overflow-x-auto">
            <Table className="min-w-[600px]"> {/* Ensure min-width so table doesn't squish */}
            <TableHeader>
                <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Code</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {productIssues.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No product issues found. Great job!
                        </TableCell>
                    </TableRow>
                ) : (
                    productIssues.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>
                                <Badge variant="destructive" className="capitalize whitespace-nowrap">
                                    {item.code.replace(/_/g, " ")}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground min-w-[200px]">
                                {item.description}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                                {item.productId}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}