// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Main.tsx

"use client";

import { useState } from "react";
import { TransdirectConfig } from "@prisma/client";
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
        <div className="w-full text-[13px] text-[#3c434a] animate-in fade-in mb-[30px]">
            
            {/* WP Page Title & Status */}
            <div className="flex items-center gap-3 mb-[15px]">
                <h2 className="text-[23px] font-normal text-[#1d2327] m-0">Transdirect Integration</h2>
                {config?.isEnabled ? (
                    <span className="bg-[#f0f0f1] border border-[#dcdcde] text-[#007017] px-[8px] py-[2px] rounded-[3px] text-[11px] font-semibold uppercase">Integration Active</span>
                ) : (
                    <span className="bg-[#f0f0f1] border border-[#dcdcde] text-[#646970] px-[8px] py-[2px] rounded-[3px] text-[11px] font-semibold uppercase">Disabled</span>
                )}
            </div>
            <p className="text-[13px] text-[#646970] mt-0 mb-[15px]">Manage your Transdirect API keys, default sender address, and live shipping quote preferences.</p>

            {/* WP subsubsub style tabs */}
            <ul className="list-none p-0 m-0 mb-[20px] text-[13px] text-[#646970] flex flex-wrap items-center">
                <li className="inline-block m-0 p-0">
                    <button
                        onClick={() => setActiveSection('creds')}
                        className={`inline-block p-0 bg-transparent border-none cursor-pointer hover:text-[#135e96] ${activeSection === 'creds' ? "text-[#000] font-semibold" : "text-[#2271b1]"}`}
                    >
                        API & Credentials
                    </button>
                    <span className="mx-2 text-[#c3c4c7]">|</span>
                </li>
                <li className="inline-block m-0 p-0">
                    <button
                        onClick={() => setActiveSection('sender')}
                        className={`inline-block p-0 bg-transparent border-none cursor-pointer hover:text-[#135e96] ${activeSection === 'sender' ? "text-[#000] font-semibold" : "text-[#2271b1]"}`}
                    >
                        Sender Address
                    </button>
                    <span className="mx-2 text-[#c3c4c7]">|</span>
                </li>
                <li className="inline-block m-0 p-0">
                    <button
                        onClick={() => setActiveSection('controls')}
                        className={`inline-block p-0 bg-transparent border-none cursor-pointer hover:text-[#135e96] ${activeSection === 'controls' ? "text-[#000] font-semibold" : "text-[#2271b1]"}`}
                    >
                        Preferences
                    </button>
                </li>
            </ul>

            {/* Content Area */}
            <div className="w-full">
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