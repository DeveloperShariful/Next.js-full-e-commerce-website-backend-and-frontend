// app/admin/products/create/_components/BundleItems.tsx

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { X, Search, Loader2, Plus, Package } from "lucide-react";
import { searchProducts } from "@/app/actions/admin/product/product-read";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { BundleItem, ProductFormData } from "../types";

export default function BundleItems() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const bundleItems = watch("bundleItems") || [];
    const productId = watch("id");

    const { formatPrice } = useGlobalStore();

    const [input, setInput] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (input.length > 1) {
                setLoading(true);
                const res = await searchProducts(input);
                if (res.success) setResults(res.data as any);
                setLoading(false);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [input]);

    const addProduct = (prod: any) => {
        if (bundleItems.some((item) => item.childProductId === prod.id)) return;
        if (productId === prod.id) return;

        const newItem: BundleItem = {
            childProductId: prod.id,
            childProductName: prod.name,
            childProductImage: prod.featuredImage || prod.images?.[0]?.url,
            quantity: 1
        };

        setValue("bundleItems", [...bundleItems, newItem]);
        setInput("");
        setResults([]);
    };

    const removeProduct = (id: string) => {
        setValue("bundleItems", bundleItems.filter((item) => item.childProductId !== id));
    };

    const updateQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        const newItems = bundleItems.map((item) => 
            item.childProductId === id ? { ...item, quantity: qty } : item
        );
        setValue("bundleItems", newItems);
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-blue-50 p-4 border border-blue-200 rounded-sm text-sm text-blue-800 mb-4 flex gap-3 items-start">
                <Package className="shrink-0 mt-0.5" size={18}/>
                <div>
                    <strong>Bundle Product Logic:</strong> Search and add existing products to create a bundle. 
                    <ul className="list-disc ml-4 mt-1 space-y-1 text-xs">
                        <li>The "Price" in General tab will be the total price of this bundle.</li>
                        <li>Inventory will be deducted from each child product automatically when sold.</li>
                    </ul>
                </div>
            </div>

            <div className="space-y-2 relative">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Search Products to Add</label>
                
                <div className="relative">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full border border-gray-400 pl-9 pr-2 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm shadow-sm"
                        placeholder="Type product name or SKU..."
                    />
                    {loading ? (
                        <Loader2 size={16} className="absolute left-3 top-3 text-gray-400 animate-spin"/>
                    ) : (
                        <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
                    )}
                </div>

                {results.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-sm shadow-xl max-h-60 overflow-y-auto mt-1">
                        {results.map((prod) => (
                            <li 
                                key={prod.id} 
                                onClick={() => addProduct(prod)}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs flex items-center gap-3 border-b border-gray-100 last:border-0 transition"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0">
                                    <img src={prod.featuredImage || prod.images?.[0]?.url || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-800 text-sm">{prod.name}</span>
                                    <span className="text-[11px] text-gray-500">
                                        SKU: {prod.sku || 'N/A'} | Price: {formatPrice(prod.price)}
                                    </span>
                                </div>
                                <Plus size={16} className="ml-auto text-[#2271b1]"/>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {bundleItems.length > 0 ? (
                <div className="border border-gray-300 rounded-sm overflow-hidden shadow-sm mt-4">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-300 font-semibold text-gray-700 text-xs uppercase">
                            <tr>
                                <th className="p-3">Product</th>
                                <th className="p-3 w-24 text-center">Quantity</th>
                                <th className="p-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {bundleItems.map((item) => (
                                <tr key={item.childProductId} className="hover:bg-gray-50 transition">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 overflow-hidden shrink-0">
                                                {item.childProductImage && (
                                                    <img src={item.childProductImage} className="w-full h-full object-cover" alt=""/>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 line-clamp-1">{item.childProductName || "Product ID: " + item.childProductId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.childProductId, parseInt(e.target.value))}
                                            className="w-16 border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#2271b1] text-center font-semibold"
                                        />
                                    </td>
                                    <td className="p-3 text-center">
                                        <button 
                                            type="button" 
                                            onClick={() => removeProduct(item.childProductId)} 
                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                                        >
                                            <X size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded bg-gray-50 text-gray-500 text-sm">
                    No products added to this bundle yet. <br/> Search above to start adding items.
                </div>
            )}
        </div>
    );
}