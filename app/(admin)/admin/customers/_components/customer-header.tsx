"use client";

import { useState } from 'react';
import { User as UserIcon, Download, Plus } from 'lucide-react';
import { AddCustomerModal } from './add-customer-modal';
import { toast } from 'react-hot-toast';

export function CustomerHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExport = () => {
    // এখানে ভবিষ্যতে আসল CSV ডাউনলোড লজিক বসানো হবে
    toast.success("Exporting customer list...", {
      icon: '📄',
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserIcon className="text-blue-600" /> Customers
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer base and purchase history.</p>
        </div>
        <div className="flex gap-2">
           {/* Export Button */}
           <button 
             onClick={handleExport}
             className="px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition active:scale-95"
           >
              <Download size={16}/> Export
           </button>

           {/* Add Customer Button */}
           <button 
             onClick={() => setIsModalOpen(true)}
             className="px-3 py-1.5 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-sm flex items-center gap-2 transition active:scale-95"
           >
              <Plus size={16}/> Add Customer
           </button>
        </div>
      </div>

      {/* Render Modal if Open */}
      {isModalOpen && <AddCustomerModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}