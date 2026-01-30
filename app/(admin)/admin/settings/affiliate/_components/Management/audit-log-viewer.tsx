//app/(admin)/admin/settings/affiliate/_components/Management/audit-log-viewer.tsx

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { History, ArrowRight } from "lucide-react";

interface LogEntry {
    id: string;
    userId: string;
    action: string;
    meta: any;
    createdAt: Date;
    user?: { name: string; email: string };
}

export default function AuditLogViewer({ logs }: { logs: LogEntry[] }) {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">
                <div className="p-2 bg-gray-100 rounded-lg">
                    <History className="w-5 h-5 text-gray-600"/>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">System Audit Logs</h3>
                    <p className="text-xs text-gray-500">Track all changes made by admins.</p>
                </div>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b text-xs uppercase font-bold text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Admin</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Changes (Diff)</th>
                            <th className="px-6 py-3 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {logs.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">No logs found.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{log.meta?.adminName || log.userId}</div>
                                        <div className="text-xs text-gray-500">ID: {log.userId.slice(0, 8)}...</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono font-bold text-gray-700">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {/* 🔥 JSON Changes Display */}
                                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                                            {log.meta?.changes ? (
                                                Object.entries(log.meta.changes).map(([key, val]: any) => (
                                                    <div key={key} className="text-xs bg-yellow-50 border border-yellow-100 p-1.5 rounded flex items-center gap-2">
                                                        <span className="font-bold text-gray-600 capitalize">{key}:</span>
                                                        <span className="text-red-500 line-through">{String(val.from)}</span>
                                                        <ArrowRight className="w-3 h-3 text-gray-400"/>
                                                        <span className="text-green-600 font-bold">{String(val.to)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">No detail diff available</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-gray-500">
                                        {format(new Date(log.createdAt), "MMM d, h:mm a")}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}