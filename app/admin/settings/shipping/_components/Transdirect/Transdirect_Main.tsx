// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Main.tsx

"use client";

import { useState } from "react";
import { TransdirectConfig } from "@prisma/client";
import { Truck } from "lucide-react";
import Transdirect_Credentials from "./Transdirect_Credentials";
import Transdirect_Sender from "./Transdirect_Sender";
import Transdirect_Controls from "./Transdirect_Controls";

interface Props {
    config: TransdirectConfig | null;
    refreshData: () => void;
}

export default function Transdirect_Main({ config, refreshData }: Props) {
    const [activeSection, setActiveSection] = useState<'creds' | 'sender' | 'controls'>('creds');

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-[#2271b1] rounded-lg">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Transdirect Integration</h2>
                        <p className="text-sm text-slate-500">Manage API keys, sender address, and shipping preferences.</p>
                    </div>
                </div>
                
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${config?.isEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {config?.isEnabled ? "INTEGRATION ACTIVE" : "DISABLED"}
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-sm">
                <button 
                    onClick={() => setActiveSection('creds')}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeSection === 'creds' ? 'border-[#2271b1] text-[#2271b1]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    API & Credentials
                </button>
                <button 
                    onClick={() => setActiveSection('sender')}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeSection === 'sender' ? 'border-[#2271b1] text-[#2271b1]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Sender Address
                </button>
                <button 
                    onClick={() => setActiveSection('controls')}
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeSection === 'controls' ? 'border-[#2271b1] text-[#2271b1]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Preferences
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white p-6 rounded-b-sm border border-t-0 border-slate-200 shadow-sm">
                {activeSection === 'creds' && (
                    <Transdirect_Credentials config={config} refreshData={refreshData} />
                )}
                {activeSection === 'sender' && (
                    <Transdirect_Sender config={config} refreshData={refreshData} />
                )}
                {activeSection === 'controls' && (
                    <Transdirect_Controls config={config} refreshData={refreshData} />
                )}
            </div>
        </div>
    );
}