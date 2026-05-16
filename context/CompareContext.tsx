// context/CompareContext.tsx

"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface ProductAttribute {
  name: string;
  options: string[];
}

export interface CompareItem {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  price?: string | null;
  image?: string | null;
  attributes?: ProductAttribute[];
}

interface CompareContextType {
  compareItems: CompareItem[];
  addToCompare: (item: CompareItem) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const savedItems = localStorage.getItem('gobike_compare_items');
    if (savedItems) {
      try {
        setCompareItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Failed to parse compare items', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gobike_compare_items', JSON.stringify(compareItems));
  }, [compareItems]);

  const addToCompare = (item: CompareItem) => {
    if (compareItems.find((p) => p.databaseId === item.databaseId)) {
      toast.error(`${item.name} is already in compare list.`);
      return;
    }
    
    if (compareItems.length >= 4) {
      toast.error("You can only compare up to 4 products at a time.");
      return;
    }

    setCompareItems((prev) => [...prev, item]);
    toast.success("Added to compare."); 
  };

  const removeFromCompare = (id: string) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Removed from compare.");
  };

  const clearCompare = () => {
    setCompareItems([]);
    toast.success("Compare list cleared.");
  };

  return (
    <CompareContext.Provider value={{ compareItems, addToCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}