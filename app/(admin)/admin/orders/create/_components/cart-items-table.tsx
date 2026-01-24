// File Location: app/admin/orders/create/_components/cart-items-table.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Package } from "lucide-react";

interface CartItemsTableProps {
    items: any[];
    onRemoveItem: (index: number) => void;
    formatPrice: (price: number) => string;
    weightUnit: string;
}

export const CartItemsTable = ({ items, onRemoveItem, formatPrice, weightUnit }: CartItemsTableProps) => {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm border border-dashed rounded-md bg-slate-50">
                        No items added yet. Search products or add a custom item.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100 hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white rounded border overflow-hidden relative flex items-center justify-center">
                                        {item.image ? (
                                            <img src={item.image} alt="" className="h-full w-full object-cover"/>
                                        ) : (
                                            <Package size={20} className="text-slate-300"/>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {item.name} 
                                            {item.sku === 'CUSTOM' && <span className="text-[10px] ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Custom</span>}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatPrice(item.price)} x {item.quantity} 
                                            {item.weight > 0 && (
                                                <span className="ml-2 text-slate-400 border-l pl-2 border-slate-300">
                                                    {item.weight} {weightUnit}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-sm text-slate-900">
                                        {formatPrice(item.price * item.quantity)}
                                    </p>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => onRemoveItem(idx)}
                                    >
                                        <Trash2 size={16}/>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};