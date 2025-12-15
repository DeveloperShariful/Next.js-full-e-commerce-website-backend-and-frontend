// app/admin/attributes/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { getAttributes } from "@/app/actions/attribute";
import { toast } from "react-hot-toast";
import { AttributeHeader } from "./_components/attribute-header";
import { AttributeForm } from "./_components/attribute-form";
import { AttributeList } from "./_components/attribute-list";

export default function AttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingData, setEditingData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAttributes(searchQuery, currentPage, 10);
      if (res.success && res.data) {
        setAttributes(res.data as any);
        if (res.meta) setTotalPages(res.meta.totalPages);
      }
    } catch (error) {
      toast.error("Failed to fetch attributes");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSuccess = () => {
    setEditingData(null);
    fetchData();
  };

  return (
    <div className="font-sans text-slate-800 pb-10">
      <AttributeHeader onRefresh={fetchData} loading={loading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <AttributeForm 
            editingData={editingData} 
            onCancelEdit={() => setEditingData(null)}
            onSuccess={handleSuccess}
          />
        </div>
        
        <div className="lg:col-span-8">
          <AttributeList 
            attributes={attributes}
            loading={loading}
            onEdit={setEditingData}
            onRefresh={fetchData}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );
}