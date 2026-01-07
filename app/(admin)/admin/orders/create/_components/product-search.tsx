// File Location: app/admin/orders/create/_components/product-search.tsx

"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react"; 
import { searchProducts } from "@/app/actions/admin/order/create_order/search-resources";
// ✅ Import Store
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface ProductSearchProps {
    onAddProduct: (product: any, variant?: any) => void;
}

export const ProductSearch = ({ onAddProduct }: ProductSearchProps) => {
    // ✅ Use Hook inside component
    const { formatPrice } = useGlobalStore();
    
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length > 0) { 
            setLoading(true);
            try {
                const res = await searchProducts(val);
                setResults(res);
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        } else {
            setResults([]);
        }
    };

    return (
        <Card className="overflow-visible relative z-50">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add Products</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search product by name or SKU..."
                        className="pl-9"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    
                    {loading && (
                        <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                    )}
                    
                    {results.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl rounded-b-md mt-1 max-h-80 overflow-y-auto z-[100]">
                            {results.map((prod) => (
                                <div key={prod.id} className="border-b border-slate-50 last:border-0">
                                    <div 
                                        className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            onAddProduct(prod);
                                            setQuery("");
                                            setResults([]);
                                        }}
                                    >
                                        <div className="flex justify-between">
                                            <p className="font-medium text-sm text-slate-900">{prod.name}</p>
                                            <p className="font-bold text-sm text-slate-900">
                                                {/* ✅ Dynamic Price Format */}
                                                {formatPrice(prod.price)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-500">Stock: {prod.stock} | SKU: {prod.sku || "N/A"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && query.length > 1 && results.length === 0 && (
                        <div className="absolute top-full left-0 w-full bg-white border border-slate-200 p-3 text-sm text-slate-500 z-[100]">
                            No products found.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};