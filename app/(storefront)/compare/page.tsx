'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gql } from '@apollo/client';
import client from '@/lib/apolloClient';
import { useCompare } from '@/context/CompareContext';
import { useCart } from '@/context/CartContext';
import Breadcrumbs from '@/components/Breadcrumbs';
import { compareSpecsMap, staticSpecLabels, StaticSpecs } from '@/lib/compareDataMap';

export interface Attribute { name: string; options: string[]; }
export interface CompareProduct {
    id: string;
    databaseId: number;
    slug: string;
    name: string;
    image?: { sourceUrl: string };
    price?: string;
    salePrice?: string;
    regularPrice?: string;
    stockStatus?: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    attributes?: { nodes: Attribute[] };
    averageRating?: number;
    reviewCount?: number;
    description?: string;
    shortDescription?: string;
}

interface GetProductQueryData {
    product: CompareProduct | null;
}

const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      slug
      name
      description
      shortDescription
      image { sourceUrl }
      averageRating
      reviewCount
      ... on SimpleProduct { 
        price(format: FORMATTED) regularPrice(format: FORMATTED) salePrice(format: FORMATTED) 
        stockStatus weight length width height attributes { nodes { name options } } 
      }
      ... on VariableProduct { 
        price(format: FORMATTED) regularPrice(format: FORMATTED) salePrice(format: FORMATTED) 
        stockStatus weight length width height attributes { nodes { name options } } 
      }
    }
  }
`;

export default function ComparePage() {
    const { compareItems, removeFromCompare, clearCompare } = useCompare();
    const { addToCart } = useCart();
    
    const [fullProducts, setFullProducts] = useState<CompareProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
                const promises = slugs.map(slug => 
                    client.query<GetProductQueryData>({
                        query: GET_PRODUCT_BY_SLUG,
                        variables: { slug },
                        fetchPolicy: 'network-only'
                    })
                );

                const responses = await Promise.all(promises);
                
                const fetchedProducts: CompareProduct[] = responses
                    .map(res => res.data?.product)
                    .filter((product): product is CompareProduct => product !== null && product !== undefined);

                fetchedProducts.sort((a, b) => {
                    const getPriceAsNumber = (p: CompareProduct) => {
                        const priceStr = p.price || p.salePrice || p.regularPrice || '0';
                        return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
                    };
                    return getPriceAsNumber(a) - getPriceAsNumber(b);
                });

                if (fetchedProducts.length > 0) {
                    setFullProducts(fetchedProducts);
                } else {
                    setErrorMsg("Products not found in the database. Please try adding them again.");
                }
            } catch (error: unknown) {
                console.error("Compare Data Fetch Error:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to fetch product details.";
                setErrorMsg(errorMessage);
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
                price: product.price || product.salePrice || product.regularPrice,
                image: product.image?.sourceUrl,
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

    const stickyThClass = "sticky left-0 z-20 bg-gray-50 min-w-[90px] w-[90px] md:min-w-[160px] md:w-[160px] p-2 md:p-4 border-b border-r border-gray-200 text-left text-xs md:text-[14px] text-gray-800 font-semibold align-middle shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]";

    return (
        <div className="font-sans bg-gray-50 min-h-screen pb-16">
            <Breadcrumbs pageTitle="Compare Products" />
            
            <div className="max-w-[1500px] mx-auto px-3 md:px-6 py-6 md:py-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-2">Compare Products</h1>
                        <p className="text-gray-600 text-sm md:text-base">Review features and specs side-by-side.</p>
                    </div>
                    <button 
                        onClick={clearCompare}
                        className="text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-md transition-colors text-sm md:text-base border border-red-100 bg-white"
                    >
                        Clear All
                    </button>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
                        <p className="text-red-700 font-bold">Oops!</p>
                        <p className="text-red-600 text-sm">{errorMsg}</p>
                    </div>
                )}

                <div className="md:hidden flex items-center justify-end gap-2 mb-3 text-blue-600 font-bold text-sm animate-pulse">
                    <span>Swipe to compare</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20 flex-col gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        <p className="text-gray-500 font-semibold">Loading product details...</p>
                    </div>
                ) : (
                    <div className="relative bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 rounded-xl">
                            <table className="w-full text-left border-collapse min-w-max">
                                
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-30 bg-gray-50 min-w-[90px] w-[90px] md:min-w-[160px] md:w-[160px] p-2 md:p-4 border-b border-r border-gray-200 text-gray-900 font-extrabold align-top text-sm md:text-[16px] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                            Product Info
                                        </th>
                                        {fullProducts.map((product) => (
                                            <td key={product.id} className="min-w-[240px] w-[240px] md:min-w-[300px] md:w-[300px] p-4 md:p-6 border-b border-r border-gray-200 text-center relative align-top bg-white group">
                                                
                                                <button 
                                                    onClick={() => removeFromCompare(product.id)}
                                                    className="absolute top-3 right-3 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white rounded-full p-1.5 border border-gray-200 shadow-sm transition-all z-20"
                                                    title="Remove"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                                
                                                <Link href={`/product/${product.slug}`} className="block mb-4 hover:opacity-80 transition-opacity no-underline">
                                                    <div className="h-[140px] md:h-[180px] w-full relative mb-3 bg-gray-50 rounded-lg p-2 border border-gray-100 group-hover:border-blue-200 transition-colors">
                                                        {product.image?.sourceUrl ? (
                                                            <Image src={product.image.sourceUrl} alt={product.name} fill className="object-contain mix-blend-multiply" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                                                        )}
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 text-[15px] md:text-[1.1rem] leading-snug min-h-[2.8rem] md:min-h-[3rem] hover:text-blue-600 transition-colors">
                                                        {product.name}
                                                    </h3>
                                                </Link>
                                                
                                                <div className="text-[1.1rem] md:text-xl font-extrabold text-[#ff3613] mb-3 md:mb-5" dangerouslySetInnerHTML={{ __html: product.price || product.salePrice || product.regularPrice || '' }} />
                                                
                                                <div className="mb-4 text-xs md:text-sm font-semibold">
                                                    {product.stockStatus === 'IN_STOCK' ? (
                                                        <span className="text-[#28a745] bg-green-50 px-2 py-1 rounded">✓ In Stock</span>
                                                    ) : product.stockStatus === 'OUT_OF_STOCK' ? (
                                                        <span className="text-[#dc3545] bg-red-50 px-2 py-1 rounded">✗ Out of Stock</span>
                                                    ) : (
                                                        <span className="text-[#fd7e14] bg-orange-50 px-2 py-1 rounded">On Backorder</span>
                                                    )}
                                                </div>

                                                <button 
                                                    onClick={() => handleAddToCart(product)}
                                                    className="w-full py-2.5 md:py-3 px-4 bg-gray-900 text-white font-bold rounded-full hover:bg-gray-700 transition-colors text-sm md:text-[15px] shadow-sm"
                                                >
                                                    Add to Cart
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {/* === Reviews === */}
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <th className={stickyThClass}>Reviews</th>
                                        {fullProducts.map((product) => (
                                            <td key={`${product.id}-reviews`} className="p-3 md:p-4 border-b border-r border-gray-200 text-center align-middle bg-white">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <div className="text-[#080808] text-[16px] md:text-[20px] tracking-widest leading-none">
                                                        {product.averageRating && product.averageRating > 0 ? "★★★★☆" : "☆☆☆☆☆"}
                                                    </div>
                                                    <span className="text-gray-500 text-[10px] md:text-xs font-medium">
                                                        ({product.reviewCount || 0} reviews)
                                                    </span>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* === Static Specs === */}
                                    {specKeys.map((key) => {
                                        const hasValueForThisKey = fullProducts.some(p => compareSpecsMap[p.slug]?.[key]);
                                        if (!hasValueForThisKey) return null;

                                        return (
                                            <tr key={key} className="hover:bg-gray-50 transition-colors">
                                                <th className={stickyThClass}>{staticSpecLabels[key]}</th>
                                                {fullProducts.map((product) => {
                                                    const staticData = compareSpecsMap[product.slug]?.[key];
                                                    return (
                                                        <td key={`${product.id}-${key}`} className="p-3 md:p-4 border-b border-r border-gray-200 text-center text-xs md:text-[14px] text-gray-700 font-medium bg-white">
                                                            {staticData ? staticData : '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}

                                    {/* === Dynamic Weight & Dimensions === */}
                                    {hasWeight && (
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <th className={stickyThClass}>Weight</th>
                                            {fullProducts.map((product) => (
                                                <td key={`${product.id}-weight`} className="p-3 md:p-4 border-b border-r border-gray-200 text-center text-xs md:text-[14px] text-gray-700 font-medium bg-white">
                                                    {product.weight ? `${product.weight} kg` : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )}

                                    {hasDimensions && (
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <th className={stickyThClass}>Dimensions</th>
                                            {fullProducts.map((product) => (
                                                <td key={`${product.id}-dim`} className="p-3 md:p-4 border-b border-r border-gray-200 text-center text-xs md:text-[14px] text-gray-700 font-medium bg-white">
                                                    {product.length && product.width && product.height ? `${product.length}×${product.width}×${product.height} cm` : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    )}

                                    {/* === Dynamic Attributes === */}
                                    {uniqueAttrNames.map((attrName) => (
                                        <tr key={attrName} className="hover:bg-gray-50 transition-colors">
                                            <th className={`${stickyThClass} capitalize`}>
                                                {attrName.replace('pa_', '').replace(/_/g, ' ')}
                                            </th>
                                            {fullProducts.map((product) => {
                                                const attr = product.attributes?.nodes.find(a => a.name === attrName);
                                                return (
                                                    <td key={`${product.id}-${attrName}`} className="p-3 md:p-4 border-b border-r border-gray-200 text-center text-xs md:text-[14px] text-gray-700 font-medium bg-white">
                                                        {attr ? attr.options.join(', ') : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}

                                    {/* === Short Description / Features === */}
                                    {showShortDescRow && (
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <th className={`${stickyThClass} align-top`}>Features</th>
                                            {fullProducts.map((product) => {
                                                const isMainBike = !!compareSpecsMap[product.slug];
                                                return (
                                                    <td key={`${product.id}-short-desc`} className="p-4 md:p-6 border-b border-r border-gray-200 text-left text-xs md:text-[14px] text-gray-600 align-top bg-white">
                                                        {!isMainBike && product.shortDescription ? (
                                                            <div 
                                                                className="[&>ul]:list-none [&>ul]:p-0 [&>ul>li]:relative [&>ul>li]:pl-4 md:[&>ul>li]:pl-5 [&>ul>li:before]:content-['✓'] [&>ul>li:before]:absolute [&>ul>li:before]:left-0 [&>ul>li:before]:text-green-600 [&>ul>li:before]:font-bold [&>ul>li]:mb-1.5"
                                                                dangerouslySetInnerHTML={{ __html: product.shortDescription }} 
                                                            />
                                                        ) : (
                                                            <div className="text-center text-gray-400">-</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    )}

                                    {/* === Full Description === */}
                                    {showDescRow && (
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <th className={`${stickyThClass} align-top rounded-bl-xl`}>Description</th>
                                            {fullProducts.map((product) => {
                                                const isMainBike = !!compareSpecsMap[product.slug];
                                                return (
                                                    <td key={`${product.id}-desc`} className="p-4 md:p-6 border-b border-r border-gray-200 text-left text-xs md:text-[14px] text-gray-600 align-top bg-white last:rounded-br-xl">
                                                        {!isMainBike && product.description ? (
                                                            <div 
                                                                className="leading-relaxed space-y-2 [&_h2]:text-sm md:[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:text-xs md:[&_h3]:text-sm [&_h3]:font-bold [&_ul]:pl-4 [&_ul]:list-disc"
                                                                dangerouslySetInnerHTML={{ __html: product.description }} 
                                                            />
                                                        ) : (
                                                            <div className="text-center text-gray-400">-</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
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