// File Location: app/admin/orders/create/_components/product-search.tsx

"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus, PackagePlus } from "lucide-react"; 
import { searchProducts } from "@/app/actions/admin/order/create_order/search-resources";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ProductSearchProps {
    onAddProduct: (product: any, variant?: any) => void;
    onAddCustomItem: (item: any) => void;
}

export const ProductSearch = ({ onAddProduct, onAddCustomItem }: ProductSearchProps) => {
    const { formatPrice, currency } = useGlobalStore();
    
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Custom Item State
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const [customItem, setCustomItem] = useState({ name: "", price: "", quantity: "1" });

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

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customItem.name || !customItem.price) return;

        onAddCustomItem({
            name: customItem.name,
            price: parseFloat(customItem.price),
            quantity: parseInt(customItem.quantity) || 1
        });
        
        setIsCustomOpen(false);
        setCustomItem({ name: "", price: "", quantity: "1" });
    };

    return (
        <>
            <Card className="overflow-visible relative z-50">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Add Products</CardTitle>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setIsCustomOpen(true)}
                    >
                        <PackagePlus size={14} className="mr-1"/> Custom Item
                    </Button>
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
                                    <div key={prod.id} className="border-b border-slate-50 last:border-0 group">
                                        {/* Main Product */}
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
                                                <p className="font-bold text-sm text-slate-900">{formatPrice(prod.price)}</p>
                                            </div>
                                            <p className="text-xs text-slate-500">Stock: {prod.stock} | SKU: {prod.sku || "N/A"}</p>
                                        </div>

                                        {/* Variants */}
                                        {prod.variants && prod.variants.length > 0 && (
                                            <div className="bg-slate-50 border-t border-slate-100 pl-4 pr-2 py-1">
                                                {prod.variants.map((v: any) => (
                                                    <div 
                                                        key={v.id}
                                                        className="flex justify-between items-center p-2 text-xs hover:bg-white rounded cursor-pointer text-slate-600 hover:text-blue-600"
                                                        onClick={() => {
                                                            onAddProduct(prod, v);
                                                            setQuery("");
                                                            setResults([]);
                                                        }}
                                                    >
                                                        <span>{v.name} - <span className="font-mono">{v.sku}</span></span>
                                                        <div className="flex gap-3">
                                                            <span>Stock: {v.stock}</span>
                                                            <span className="font-bold">{formatPrice(v.price)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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

            {/* Custom Item Modal */}
            <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Custom Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCustomSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input 
                                id="name" 
                                value={customItem.name} 
                                onChange={(e) => setCustomItem({...customItem, name: e.target.value})} 
                                placeholder="e.g. Rush Fee"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price ({currency})</Label>
                                <Input 
                                    id="price" 
                                    type="number" 
                                    step="0.01" 
                                    value={customItem.price} 
                                    onChange={(e) => setCustomItem({...customItem, price: e.target.value})} 
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="qty">Quantity</Label>
                                <Input 
                                    id="qty" 
                                    type="number" 
                                    min="1" 
                                    value={customItem.quantity} 
                                    onChange={(e) => setCustomItem({...customItem, quantity: e.target.value})} 
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Add Item</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};