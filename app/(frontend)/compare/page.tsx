// app/(frontend)/compare/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';
import { useCart } from '@/context/CartContext';
import Breadcrumbs from '@/components/Breadcrumbs';
import { compareSpecsMap, staticSpecLabels, StaticSpecs } from '@/lib/compareDataMap';
import { getCompareProductsAction } from '@/app/actions/frontend/product/getCompareProductsAction';

export interface Attribute { name: string; options: string[]; }
export interface CompareProduct {
    id: string;
    databaseId: number;
    slug: string;
    name: string;
    image?: { sourceUrl: string } | null;
    price?: string;
    salePrice?: string | null;
    regularPrice?: string;
    stockStatus?: string;
    weight?: number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    attributes?: { nodes: Attribute[] };
    averageRating?: number;
    reviewCount?: number;
    description?: string;
    shortDescription?: string;
}

export default function ComparePage() {
    const { compareItems, removeFromCompare, clearCompare } = useCompare();
    const { addToCart } = useCart();
    
    const [fullProducts, setFullProducts] = useState<CompareProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // ★ ওয়ার্ডপ্রেসের আবর্জনা (\n) ক্লিন করার ফাংশন
    const cleanHTML = (html?: string) => {
        if (!html) return '';
        // ডাটাবেজের সব \n এবং \r মুছে ক্লিন টেক্সট রিটার্ন করবে
        return html.replace(/\\n/g, '').replace(/\\r/g, '').replace(/\n/g, '').trim();
    };

    useEffect(() => {
        const fetchProducts = async () => {
            if (compareItems.length === 0) {
                setFullProducts([]);
                setLoading(false);
                return;
            }

            const slugs = compareItems.map(item => item.slug).filter(Boolean);
            setLoading(true);
            setErrorMsg(null);
            
            try {
                const response = await getCompareProductsAction(slugs);
                
                if (response.success && response.products) {
                    const fetchedProducts = response.products as CompareProduct[];
                    
                    fetchedProducts.sort((a, b) => {
                        const getPriceAsNumber = (p: CompareProduct) => {
                            const priceStr = p.price || p.salePrice || p.regularPrice || '0';
                            return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
                        };
                        return getPriceAsNumber(a) - getPriceAsNumber(b);
                    });

                    setFullProducts(fetchedProducts);
                } else {
                    setErrorMsg(response.error || "Products not found.");
                }
            } catch (error: unknown) {
                setErrorMsg("Failed to fetch product details.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [compareItems]);

    const handleAddToCart = async (product: CompareProduct) => {
        try {
            await addToCart({
                id: product.id,
                databaseId: product.databaseId,
                name: product.name,
                price: product.price || product.salePrice || product.regularPrice || "0.00",
                image: product.image?.sourceUrl || null,
                slug: product.slug,
            }, 1);
        } catch (error) {
            console.error("Error adding to cart from compare", error);
        }
    };

    if (compareItems.length === 0) {
        return (
            <div className="max-w-[1300px] mx-auto px-4 py-16 text-center font-sans min-h-[50vh] flex flex-col justify-center items-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Compare Products</h1>
                <p className="text-gray-500 mb-8 text-lg">You haven't added any products to compare yet.</p>
                <Link href="/bikes" className="px-8 py-3 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-700 transition-colors">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    const specKeys = Object.keys(staticSpecLabels) as Array<keyof StaticSpecs>;   
    const allAttrNames = new Set<string>();
    fullProducts.forEach(p => {
        p.attributes?.nodes.forEach(attr => allAttrNames.add(attr.name));
    });
    const uniqueAttrNames = Array.from(allAttrNames);
    const hasWeight = fullProducts.some(p => p.weight !== null && p.weight !== undefined);
    const hasDimensions = fullProducts.some(p => p.length && p.width && p.height);
    const showShortDescRow = fullProducts.some(p => !compareSpecsMap[p.slug] && p.shortDescription);
    const showDescRow = fullProducts.some(p => !compareSpecsMap[p.slug] && p.description);

    const stickyThClass = "sticky left-0 z-20 bg-gray-50 min-w-[100px] w-[100px] md:min-w-[180px] md:w-[180px] p-3 md:p-5 border-b border-r border-gray-200 text-left text-xs md:text-[15px] text-gray-800 font-bold align-middle shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]";

    // ★ FIX: কলামের সাইজ লিমিট করার জন্য max-w এবং break-words ব্যবহার করা হয়েছে
    const productTdClass = "min-w-[240px] w-[240px] max-w-[240px] md:min-w-[300px] md:w-[300px] md:max-w-[300px] p-4 md:p-6 border-b border-r border-gray-200 text-center relative align-top bg-white group break-words whitespace-normal";

    return (
        <div className="font-sans bg-gray-50 min-h-screen pb-16">
            <Breadcrumbs pageTitle="Compare Products" />
            
            <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-6 md:py-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2">Compare Products</h1>
                        <p className="text-gray-600 text-sm md:text-base">Review features and specs side-by-side.</p>
                    </div>
                    <button 
                        onClick={clearCompare}
                        className="text-red-600 font-bold hover:bg-red-50 px-5 py-2.5 rounded-full transition-all text-sm md:text-base border border-red-100 bg-white shadow-sm"
                    >
                        Clear All
                    </button>
                </div>

                <div className="md:hidden flex items-center justify-end gap-2 mb-4 text-blue-600 font-bold text-sm animate-pulse">
                    <span>Swipe to compare</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32 flex-col gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        <p className="text-gray-500 font-bold">Loading product details...</p>
                    </div>
                ) : (
                    <div className="relative bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 rounded-2xl">
                            <table className="w-full text-left border-collapse min-w-max">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-30 bg-gray-50 min-w-[100px] w-[100px] md:min-w-[180px] md:w-[180px] p-4 md:p-6 border-b border-r border-gray-200 text-gray-900 font-black align-top text-sm md:text-[17px] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                            Comparison
                                        </th>
                                        {fullProducts.map((product) => (
                                            <td key={product.id} className={productTdClass}>
                                                
                                                <button 
                                                    onClick={() => removeFromCompare(product.id)}
                                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full p-1.5 transition-all z-20 border border-transparent hover:border-red-100"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                                
                                                <Link href={`/product/${product.slug}`} className="block mb-6 no-underline">
                                                    <div className="h-[150px] md:h-[200px] w-full relative mb-4 bg-[#f9f9f9] rounded-xl p-3 border border-gray-50 group-hover:border-blue-100 transition-all">
                                                        {product.image?.sourceUrl ? (
                                                            <Image src={product.image.sourceUrl} alt={product.name} fill className="object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 text-base md:text-xl leading-tight min-h-[3.2rem] md:min-h-[3.5rem] group-hover:text-blue-600 transition-colors line-clamp-2">
                                                        {product.name}
                                                    </h3>
                                                </Link>
                                                
                                                <div className="text-xl md:text-2xl font-black text-[#ff3613] mb-5" dangerouslySetInnerHTML={{ __html: product.price || '' }} />
                                                
                                                <div className="mb-6">
                                                    {product.stockStatus === 'IN_STOCK' ? (
                                                        <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs md:text-sm font-bold border border-emerald-100">✓ In Stock</span>
                                                    ) : (
                                                        <span className="text-red-600 bg-red-50 px-3 py-1.5 rounded-full text-xs md:text-sm font-bold border border-red-100">✗ Out of Stock</span>
                                                    )}
                                                </div>

                                                <button 
                                                    onClick={() => handleAddToCart(product)}
                                                    className="w-full py-3 md:py-4 px-6 bg-black text-white font-black rounded-xl hover:bg-gray-800 transition-all text-sm md:text-base shadow-lg active:scale-95"
                                                >
                                                    Add to Cart
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="text-gray-700">
                                    {/* === Reviews === */}
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <th className={stickyThClass}>Reviews</th>
                                        {fullProducts.map((product) => {
                                            const rating = product.averageRating || 0;
                                            return (
                                                <td key={`${product.id}-reviews`} className={productTdClass}>
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <div className="text-[#ffc107] text-[18px] md:text-[22px] tracking-widest leading-none">
                                                            {rating > 0 
                                                                ? Array.from({ length: 5 }).map((_, i) => (
                                                                    <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
                                                                  ))
                                                                : "☆☆☆☆☆"
                                                            }
                                                        </div>
                                                        <span className="text-gray-400 text-xs font-bold uppercase tracking-tighter">
                                                            ({product.reviewCount || 0} reviews)
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* === Static Specs === */}
                                    {specKeys.map((key) => {
                                        const hasValueForThisKey = fullProducts.some(p => compareSpecsMap[p.slug]?.[key]);
                                        if (!hasValueForThisKey) return null;

                                        return (
                                            <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                                                <th className={stickyThClass}>{staticSpecLabels[key]}</th>
                                                {fullProducts.map((product) => {
                                                    const staticData = compareSpecsMap[product.slug]?.[key];
                                                    return (
                                                        <td key={`${product.id}-${key}`} className={productTdClass}>
                                                            <span className="text-gray-600 font-medium">{staticData ? staticData : '-'}</span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}

                                    {/* === Dynamic Weight & Dimensions === */}
                                    {hasWeight && (
                                        <tr className="hover:bg-gray-50 transition-colors bg-gray-50/20">
                                            <th className={stickyThClass}>Weight</th>
                                            {fullProducts.map((product) => (
                                                <td key={`${product.id}-weight`} className={productTdClass}>
                                                    <span className="font-bold text-gray-900">{product.weight ? `${product.weight} kg` : '-'}</span>
                                                </td>
                                            ))}
                                        </tr>
                                    )}

                                    {hasDimensions && (
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <th className={stickyThClass}>Dimensions</th>
                                            {fullProducts.map((product) => (
                                                <td key={`${product.id}-dim`} className={productTdClass}>
                                                    <span className="font-medium text-gray-600">{product.length && product.width && product.height ? `${product.length}×${product.width}×${product.height} cm` : '-'}</span>
                                                </td>
                                            ))}
                                        </tr>
                                    )}

                                    {/* === Dynamic Attributes === */}
                                    {uniqueAttrNames.map((attrName) => (
                                        <tr key={attrName} className="hover:bg-gray-50 transition-colors bg-gray-50/10">
                                            <th className={`${stickyThClass} capitalize`}>
                                                {attrName.replace('pa_', '').replace(/_/g, ' ')}
                                            </th>
                                            {fullProducts.map((product) => {
                                                const attr = product.attributes?.nodes.find(a => a.name === attrName);
                                                return (
                                                    <td key={`${product.id}-${attrName}`} className={productTdClass}>
                                                        <span className="font-bold text-blue-600">{attr ? attr.options.join(', ') : '-'}</span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}

                                    {/* === Short Description / Features === */}
                                    {showShortDescRow && (
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <th className={`${stickyThClass} align-top pt-8`}>Features</th>
                                            {fullProducts.map((product) => {
                                                return (
                                                    <td key={`${product.id}-short-desc`} className={`${productTdClass} text-left align-top`}>
                                                        {product.shortDescription ? (
                                                            // ★ cleanHTML কল করা হয়েছে 
                                                            <div 
                                                                className="[&>ul]:list-none [&>ul]:p-0 [&>ul>li]:relative [&>ul>li]:pl-6 [&>ul>li:before]:content-['✓'] [&>ul>li:before]:absolute [&>ul>li:before]:left-0 [&>ul>li:before]:text-green-600 [&>ul>li:before]:font-black [&>ul>li]:mb-2 text-sm text-gray-600"
                                                                dangerouslySetInnerHTML={{ __html: cleanHTML(product.shortDescription) }} 
                                                            />
                                                        ) : (
                                                            <div className="text-center text-gray-300">-</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    )}

                                    {/* === Full Description === */}
                                    {showDescRow && (
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <th className={`${stickyThClass} align-top pt-8 rounded-bl-2xl`}>Description</th>
                                            {fullProducts.map((product) => (
                                                <td key={`${product.id}-desc`} className={`${productTdClass} text-left align-top last:rounded-br-2xl`}>
                                                    {product.description ? (
                                                        // ★ cleanHTML কল করা হয়েছে 
                                                        <div 
                                                            className="text-xs md:text-sm text-gray-500 leading-relaxed italic line-clamp-[12]"
                                                            dangerouslySetInnerHTML={{ __html: cleanHTML(product.description) }} 
                                                        />
                                                    ) : (
                                                        <div className="text-center text-gray-300">-</div>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}