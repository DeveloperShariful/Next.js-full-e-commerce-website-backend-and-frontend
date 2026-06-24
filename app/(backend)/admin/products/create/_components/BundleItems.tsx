// app/admin/products/create/_components/BundleItems.tsx

// File: app/admin/products/create/_components/BundleItems.tsx

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import { searchProducts } from "@/app/actions/backend/product/product-read";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { BundleItem, ProductFormData } from "../types";

type ProductSearchResult = {
    id: string;
    name: string;
    featuredImage?: string | null;
    sku?: string | null;
    price?: number | null;
    images?: { url: string }[];
};

export default function BundleItems() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const bundleItems = watch("bundleItems") || [];
    const productId = watch("id");

    const { formatPrice } = useGlobalStore();

    const [input, setInput] = useState("");
    const [results, setResults] = useState<ProductSearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (input.length > 1) {
                setLoading(true);
                const res = await searchProducts(input);
                if (res.success) setResults(res.data as unknown as ProductSearchResult[]);
                setLoading(false);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [input]);

    const addProduct = (prod: ProductSearchResult) => {
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

    // WP Input Class
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none bg-white box-border";

    return (
        <div className="w-full text-[13px] text-[#3c434a]">
            
            {/* WP Style Notice */}
            <div className="bg-[#fff8e5] border-l-[4px] border-[#f56e28] p-[12px] mb-[20px] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <p className="m-0 font-semibold mb-1 text-[#1d2327]">Bundle Product Logic:</p>
                <ul className="m-0 pl-[20px] list-disc text-[#646970]">
                    <li>Search and add existing products to create a bundle.</li>
                    <li>The "Price" in General tab will be the total price of this bundle.</li>
                    <li>Inventory will be deducted from each child product automatically when sold.</li>
                </ul>
            </div>

            {/* WP Search Box */}
            <div className="mb-[20px] relative max-w-[500px]">
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-[5px]">Search Products to Add</label>
                <div className="relative">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className={`${wpInputClass} w-full`}
                        placeholder="Type product name or SKU..."
                    />
                    {loading && (
                        <div className="absolute right-2 top-2">
                            <Loader2 size={16} className="text-[#8c8f94] animate-spin"/>
                        </div>
                    )}
                </div>

                {/* WP Style Dropdown Results */}
                {results.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-[#c3c4c7] shadow-md max-h-[250px] overflow-y-auto mt-[1px] m-0 p-0 list-none rounded-[3px]">
                        {results.map((prod) => (
                            <li 
                                key={prod.id} 
                                onClick={() => addProduct(prod)}
                                className="px-[12px] py-[8px] hover:bg-[#2271b1] hover:text-white cursor-pointer flex items-center gap-[10px] border-b border-[#f0f0f1] last:border-none group"
                            >
                                <div className="w-[30px] h-[30px] bg-[#f0f0f1] border border-[#dcdcde] shrink-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url(${prod.featuredImage || prod.images?.[0]?.url || "/placeholder.jpg"})` }}></div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[#1d2327] group-hover:text-white leading-tight">{prod.name}</span>
                                    <span className="text-[11px] text-[#646970] group-hover:text-blue-100">
                                        SKU: {prod.sku || 'N/A'} &mdash; {formatPrice(prod.price)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* WP List Table for Selected Items */}
            {bundleItems.length > 0 ? (
                <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                                <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Product Name</th>
                                <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] w-[100px] text-center">Quantity</th>
                                <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] w-[50px] text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bundleItems.map((item, index) => (
                                <tr key={item.childProductId} className={`border-b border-[#f0f0f1] last:border-none ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                                    <td className="px-[10px] py-[8px]">
                                        <div className="flex items-center gap-[10px]">
                                            <div className="w-[30px] h-[30px] bg-[#f0f0f1] border border-[#dcdcde] shrink-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url(${item.childProductImage || "/placeholder.jpg"})` }}></div>
                                            <strong className="text-[#2271b1] text-[13px]">{item.childProductName || "Product ID: " + item.childProductId}</strong>
                                        </div>
                                    </td>
                                    <td className="px-[10px] py-[8px] text-center">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.childProductId, parseInt(e.target.value))}
                                            className={`${wpInputClass} !w-[60px] text-center`}
                                        />
                                    </td>
                                    <td className="px-[10px] py-[8px] text-center">
                                        <button 
                                            type="button" 
                                            onClick={() => removeProduct(item.childProductId)} 
                                            className="bg-transparent border-none text-[#d63638] hover:text-[#b32d2e] cursor-pointer p-1"
                                            title="Remove item"
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
                <div className="text-center py-[40px] px-[20px] bg-[#f9f9f9] border border-dashed border-[#c3c4c7] text-[#646970] italic rounded-[3px]">
                    No products added to this bundle yet. Search above to start adding items.
                </div>
            )}
        </div>
    );
}