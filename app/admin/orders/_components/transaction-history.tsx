// File Location: app/admin/orders/_components/transaction-history.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, History, RefreshCcw } from "lucide-react";
import { format } from "date-fns";

export const TransactionHistory = ({ order }: { order: any }) => {
  const transactions = order.transactions || [];
  const disputes = order.disputes || [];
  const returns = order.returns || [];

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
        
        {/* 1. DISPUTE ALERT */}
        {disputes.length > 0 && (
             <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
                <div className="flex items-center gap-2 text-red-700 font-bold mb-1">
                    <AlertTriangle size={18} /> Payment Dispute Detected
                </div>
                <p className="text-sm text-red-600 mb-2">
                    This order has an active dispute or chargeback. Please review the evidence immediately.
                </p>
                {disputes.map((dispute: any) => (
                    <div key={dispute.id} className="text-xs bg-white p-2 rounded border border-red-100 flex justify-between">
                        <span>Status: <span className="font-bold uppercase">{dispute.status}</span></span>
                        <span className="font-mono">{formatMoney(dispute.amount)}</span>
                    </div>
                ))}
             </div>
        )}

        {/* 2. TRANSACTION LOGS */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                    <History size={14}/> Transaction Log
                </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-xs w-[140px]">Date</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Gateway</TableHead>
                            <TableHead className="text-xs">Transaction ID</TableHead>
                            <TableHead className="text-xs text-right">Amount</TableHead>
                            <TableHead className="text-xs text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-xs text-slate-400 py-4">
                                    No transaction logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx: any) => (
                                <TableRow key={tx.id} className="text-xs">
                                    <TableCell className="text-slate-500">
                                        {format(new Date(tx.createdAt), "MMM d, h:mm a")}
                                    </TableCell>
                                    <TableCell className="font-medium uppercase text-slate-700">
                                        {tx.type}
                                    </TableCell>
                                    <TableCell className="capitalize text-slate-500">
                                        {tx.gateway}
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-500 text-[10px]">
                                        {tx.transactionId}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatMoney(tx.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className={
                                            tx.status === 'SUCCESS' || tx.status === 'succeeded' 
                                            ? "bg-green-50 text-green-700 border-green-200" 
                                            : "bg-red-50 text-red-700 border-red-200"
                                        }>
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>

        {/* 3. RETURN REQUESTS */}
        {returns.length > 0 && (
             <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                        <RefreshCcw size={14}/> Return Requests
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                    {returns.map((ret: any) => (
                        <div key={ret.id} className="flex justify-between items-start border border-slate-100 p-3 rounded-md bg-white">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="uppercase text-[10px]">{ret.status}</Badge>
                                    <span className="text-xs text-slate-400">{format(new Date(ret.createdAt), "MMM d, yyyy")}</span>
                                </div>
                                <p className="text-sm text-slate-700 font-medium">Reason: {ret.reason}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-slate-400 italic">Action pending</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
             </Card>
        )}
    </div>
  );
};