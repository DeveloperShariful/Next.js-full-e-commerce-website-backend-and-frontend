// File: app/product/[slug]/_components/ProductClient.tsx

'use client';

import { useState, useEffect, useRef, ComponentType } from 'react';
import Image from 'next/image';
import QuantityAddToCart from './QuantityAddToCart';
import ReviewForm from './ReviewForm';
import ProductCard from '@/components/ProductCard';
import { gtmViewItem } from '@/lib/gtm';
import { klaviyoTrackViewedProduct } from '@/lib/klaviyo';
import { productVideoMap } from '../../productVideos';
import LazyLoadYouTube from '../../custom-sections/YouTubVideo/LazyLoadYouTube';
import StickyAddToCart from './StickyAddToCart';
import { productLayoutMap } from '../../productLayoutMap';
import { productInfoPanelsMap } from '../../productInfoPanelsMap';
import SlideOutPanel from '../../custom-sections/SlideOutPanel';

// --- Types ---
interface ImageNode { sourceUrl: string; }
interface Attribute { name: string; options: string[]; label?: string; }
interface VariationAttribute { name: string; value: string; }

interface Variation {
  id: string; // ✅ FIX: Added true UUID id to type definition
  databaseId: number;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  stockStatus?: string;
  stockQuantity?: number;
  name?: string;
  attributes: { nodes: VariationAttribute[] };
  image?: ImageNode;
}

interface ReviewMedia {
  url: string;
  type: string;
}

interface ReplyEdge {
  node: {
    id: string;
    author: { node: { name: string; avatar?: { url: string } }; };
    content: string;
    date: string;
  };
}

interface ReviewEdge {
  rating: number;
  node: {
    id: string;
    databaseId: number; 
    author: { node: { name: string; avatar?: { url: string } }; };
    content: string;
    date: string;
    reviewMedia?: ReviewMedia[]; 
    replies?: { edges: ReplyEdge[] }; 
  };
}

interface RelatedProduct { 
  id: string; 
  databaseId: number; 
  name: string; 
  slug: string; 
  image?: ImageNode; 
  price?: string; 
  onSale: boolean; 
  averageRating: number;
  reviewCount: number;
  salePrice?: string;
  regularPrice?: string;
}

interface Product {
  id: string;
  databaseId: number;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  image?: ImageNode;
  galleryImages: { nodes: ImageNode[]; };
  price?: string;
  onSale: boolean;
  regularPrice?: string;
  salePrice?: string;
  stockStatus?: string | null;
  stockQuantity?: number | null;
  attributes: { nodes: Attribute[]; };
  variations?: { nodes: Variation[]; };
  averageRating: number;
  reviewCount: number;
  reviews: { edges: ReviewEdge[]; };
  related: { nodes: RelatedProduct[]; };
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

// --- Helper Functions ---
const cleanStr = (str: string) => {
  if (!str) return '';
  return str.toLowerCase().replace(/pa_/g, '').replace(/[^a-z0-9]/g, ''); 
};

const formatLabel = (name: string) => {
  const clean = name.replace(/^pa_/, '').replace(/_/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const SIZE_ORDER = ['110', '120', '130', '140', '150', '160', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

export default function ProductClient({ product }: { product: Product }) {
  // --- State Management ---
  const [mainImage, setMainImage] = useState<string | undefined>(product.image?.sourceUrl);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentVariation, setCurrentVariation] = useState<Variation | null>(null);
  
  const isVariableProduct = product.variations && product.variations.nodes && product.variations.nodes.length > 0;

  // --- Helper Logic ---
  const parsePrice = (priceStr?: string): number => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  };

  // --- Attribute Selection Logic ---
  const handleAttributeSelect = (attributeName: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attributeName]: value };
    setSelectedAttributes(newAttributes);

    if (!isVariableProduct) return;

    const matchingVariation = product.variations?.nodes.find(variation => {
      const isMatch = variation.attributes.nodes.every(varAttr => {
        const varName = cleanStr(varAttr.name);
        const varValue = cleanStr(varAttr.value);
        if (!varValue) return true; 

        const userKey = Object.keys(newAttributes).find(k => cleanStr(k) === varName);
        if (!userKey) return false; 
        return varValue === cleanStr(newAttributes[userKey]);
      });
      return isMatch;
    });

    const requiredAttributeCount = product.attributes.nodes.length;
    const selectedAttributeCount = Object.keys(newAttributes).length;

    if (matchingVariation && selectedAttributeCount >= requiredAttributeCount) {
      setCurrentVariation(matchingVariation);
      if (matchingVariation.image?.sourceUrl) {
        setMainImage(matchingVariation.image.sourceUrl);
      }
    } else {
      setCurrentVariation(null);
    }
  };

  // --- Dynamic Display Logic ---
  const displayPrice = currentVariation?.price || product.price;
  const displaySalePrice = currentVariation?.salePrice || product.salePrice;
  const displayRegularPrice = currentVariation?.regularPrice || product.regularPrice;
  const isOnSale = currentVariation ? (!!currentVariation.salePrice) : product.onSale;
  const currentStockStatus = currentVariation ? currentVariation.stockStatus : product.stockStatus;
  const currentStockQty = currentVariation ? currentVariation.stockQuantity : product.stockQuantity;
  const isSelectionMissing = isVariableProduct && !currentVariation;

  const regularPriceNum = parsePrice(displayRegularPrice);
  const salePriceNum = parsePrice(displaySalePrice);
  const discountPercent = regularPriceNum > 0 && salePriceNum < regularPriceNum 
    ? Math.round(((regularPriceNum - salePriceNum) / regularPriceNum) * 100) 
    : 0;

  // --- Refs & Other Hooks ---
  const mainAddToCartRef = useRef<HTMLDivElement | null>(null);
  const [isStickyVisible, setStickyVisible] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  
  const CustomSections = productLayoutMap[product.slug] || [];
  const panelConfigs = productInfoPanelsMap[product.slug] || [];
  const activePanelConfig = panelConfigs.find(p => p.id === activePanel);
  const PanelContentComponent = activePanelConfig?.component as ComponentType<{ product: Product }> | undefined;

  // Sticky Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isAboveViewport = entry.boundingClientRect.top < 0;
        setStickyVisible(!entry.isIntersecting && isAboveViewport);
      },
      { rootMargin: "0px", threshold: [0, 1] } 
    );
    const currentRef = mainAddToCartRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  // Tracking
  useEffect(() => {
    if (product) {
      const priceString = product.salePrice || product.price || '0';
      const priceNum = parseFloat(priceString.replace(/[^0-9.]/g, ''));

      gtmViewItem({ item_name: product.name, item_id: product.databaseId, price: priceNum, quantity: 1 });

      klaviyoTrackViewedProduct({
        ProductID: product.databaseId,
        ProductName: product.name,
        Quantity: 1,
        ItemPrice: priceNum,
        RowTotal: priceNum,
        ProductURL: `${window.location.origin}/product/${product.slug}`,
        ImageURL: product.image?.sourceUrl || '',
      });
    }
  }, [product]);
      
  if (!product) return null;

  // ডেটা ম্যাপ করে Cart এ পাঠানোর জন্য
  const productForCart = {
    id: product.id,
    databaseId: product.databaseId, 
    // ✅ FIX: Passed real UUID string 'id' instead of fake 'databaseId.toString()'
    variationId: currentVariation ? currentVariation.id : undefined, 
    name: product.name + (currentVariation && Object.keys(selectedAttributes).length > 0 ? ` - ${Object.values(selectedAttributes).join(', ')}` : ''),
    price: displayPrice,
    image: product.image?.sourceUrl,
    slug: product.slug,
  };

  const allImages = [product.image, ...product.galleryImages.nodes].filter(Boolean) as ImageNode[];
  const videoData = productVideoMap[product.slug];  
  
  const sortedAttributeNodes = product.attributes?.nodes ? [...product.attributes.nodes].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA.includes('color')) return -1;
    if (nameB.includes('color')) return 1;
    return 0;
  }) : [];

  return (
    <div className="max-w-[1300px] mx-auto mt-2 pb-12 px-[0.7rem] font-sans">
      
      <div className="grid grid-cols-1 md:grid-cols-[520px_1fr] gap-12 items-start">
        
        {/* Gallery Container */}
        <div className="flex flex-col gap-4 relative md:sticky md:top-[100px]">
          {mainImage && (
            <Image 
                src={mainImage} 
                alt={product.name} 
                width={1000} 
                height={1000} 
                className="w-full h-auto rounded-xl border border-[#eaeaea] max-h-[55vh] object-contain" 
            />
          )}
          {allImages.length > 1 && (
            <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-600">
              {allImages.map((img, index) => (
                <Image 
                    key={index} 
                    src={img.sourceUrl} 
                    width={800} 
                    height={800} 
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className={`h-[90px] w-[90px] md:h-[150px] md:w-[150px] object-cover rounded-md border-2 cursor-pointer transition-colors duration-200 flex-shrink-0 flex-basis-[calc(25%-0.75rem)] hover:border-[#0070f3] ${mainImage === img.sourceUrl ? 'border-[#070707]' : 'border-[#c0c0c0]'}`}
                    onClick={() => setMainImage(img.sourceUrl)} 
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-[1.6rem] leading-[1.3] ml-2 font-bold text-[#1a202c] mb-0">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-3 ml-2 mt-1">
            <div className="text-[#080808] text-[20px] tracking-widest leading-none">
                {product.averageRating > 0 
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < Math.round(product.averageRating) ? "★" : "☆"}</span>
                      ))
                    : "☆☆☆☆☆"
                }
            </div>
            {product.reviewCount > 0 ? (
                <a href="#reviews" className="text-[#777] text-sm">({product.reviewCount} customer reviews)</a>
            ) : (
                <div className="text-[#777] text-sm">(No reviews yet)</div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-6 mt-4">
            <Image src="https://gobikes.au/wp-content/uploads/2025/08/hot-deal.svg" width={50} height={50} alt="Hot Deal" className="h-8 w-auto md:h-10" />
            {isOnSale && displaySalePrice ? (
                <div className="flex items-baseline gap-3 md:gap-1 relative">
                    <span className="text-lg md:text-xl font-bold text-gray-400 line-through" dangerouslySetInnerHTML={{ __html: displayRegularPrice || '' }} />
                    <span className="text-2xl md:text-3xl font-extrabold text-[#ff3613]" dangerouslySetInnerHTML={{ __html: displaySalePrice }} />
                    {discountPercent > 0 && (
                        <span className="bg-[#ff0202] text-white px-2 py-0.5 rounded text-sm md:text-base font-bold transform -rotate-2 shadow-sm whitespace-nowrap ml-2">
                            -{discountPercent}%
                        </span>
                    )}
                </div>
            ) : (
                <div className="text-[2rem] font-extrabold text-[#ff3613]" dangerouslySetInnerHTML={{ __html: displayPrice || '' }} />
            )}
          </div>
        
          <div className="my-4 font-semibold text-base">
            {currentStockStatus === 'IN_STOCK' ? (
                currentStockQty && currentStockQty > 0 && currentStockQty <= 5 ? 
                    <span className="text-[#d9534f]">Hurry! Only {currentStockQty} left in stock!</span> :
                    <span className="text-[#28a745]">✓ In Stock &amp; Ready to Ship</span>
            ) : currentStockStatus === 'OUT_OF_STOCK' ? (
                <span className="text-[#dc3545]">✗ Out of Stock</span>
            ) : currentStockStatus === 'ON_BACKORDER' ? (
                <span className="text-[#fd7e14]">Available on Backorder</span>
            ) : null}
          </div>

          {product.shortDescription && (
            <div 
                className="w-full break-words overflow-hidden [&_p]:break-words [&_a]:break-all [&>ul]:grid [&>ul]:grid-cols-1 md:[&>ul]:grid-cols-2 gap-x-8 gap-y-2 list-none p-0 [&>li]:relative [&>li]:pl-6 [&>li:before]:content-['✓'] [&>li:before]:absolute [&>li:before]:left-0 [&>li:before]:text-green-600 [&>li:before]:font-bold mt-6 text-[#444]" 
                dangerouslySetInnerHTML={{ __html: product.shortDescription }} 
            />
          )}

          {/* === Attributes Selection === */}
          {sortedAttributeNodes.map((attr) => {
            let displayOptions = [...attr.options]; 
            if (attr.name.toLowerCase().includes('size')) {
                displayOptions.sort((a, b) => {
                    const indexA = SIZE_ORDER.indexOf(a.toUpperCase());
                    const indexB = SIZE_ORDER.indexOf(b.toUpperCase());
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return 0; 
                });
            }

            return (
                <div key={attr.name} className="pt-2.5 mb-6 border-b border-[#f0f0f0] pb-5 last:border-b-0">
                    <div className="block text-sm font-bold uppercase tracking-[0.5px] text-[#222] mb-2.5 mt-1.5">
                        {formatLabel(attr.name)}: 
                        <span className="font-normal text-[#666] ml-1.5 uppercase text-xs font-extrabold">{selectedAttributes[attr.name]}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2.5">
                        {displayOptions.map((option) => {
                            const isActive = cleanStr(selectedAttributes[attr.name]) === cleanStr(option);
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleAttributeSelect(attr.name, option)}
                                    className={`py-2.5 px-5 text-sm font-medium border rounded cursor-pointer transition-all duration-200 min-w-[50px] text-center uppercase ${
                                     isActive 
                                    ? 'bg-black text-white border-black font-semibold shadow-sm -translate-y-px' 
                                    : 'bg-white text-[#333] border-[#e1e1e1] hover:border-[#333]'
                                    }`}
                                  >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
          })}

          {/* === Add to Cart Section === */}
          <div ref={mainAddToCartRef}>
              {isVariableProduct && !currentVariation ? (
                  <div className="mt-5">
                      <button disabled className="p-4 w-full bg-[#e5e5e5] text-[#888] border-none rounded cursor-not-allowed font-bold transition-all">
                          {Object.keys(selectedAttributes).length < product.attributes.nodes.length ? "Select Options to Proceed" : "Unavailable / Out of Stock"}
                      </button>
                  </div>
              ) : (
                  <QuantityAddToCart product={productForCart} />
              )}
          </div>

          {/* === Trust Badges === */}
          <div className="mt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-gray-100">
              <div className="text-left md:text-center text-[13px] md:text-[15px] font-bold text-[#333]">✓ 100% Secure Checkout</div>
              <div className="text-left md:text-center text-[13px] md:text-[15px] font-bold text-[#333]">✓ 30 Days Easy Returns</div>
              <div className="text-left md:text-center text-[13px] md:text-[15px] font-bold text-[#333]">✓ 1 Year Full Warranty</div>
              <div className="text-left md:text-center text-[13px] md:text-[15px] font-bold text-[#333]">✓ Fast Shipping Aus-Wide</div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-[#777] mb-2 font-medium">Guaranteed Safe Checkout</p>
            <Image src="https://gobikes.au/wp-content/uploads/2018/07/trust-symbols_b-1.jpg" width={1600} height={160} alt="Payment Methods" className="w-full max-w-[1500px] h-auto p-0 opacity-80" />
          </div>
        </div>
      </div>

      {/* === Panels & Custom Sections === */}
      {panelConfigs.length > 0 && (
        <div className="w-full max-w-[1200px] mx-auto mt-16 border-t border-[#e5e5e5]">
            {panelConfigs.map((panel) => (
                <div 
                    key={panel.id} 
                    className="flex justify-between items-center py-5 border-b border-[#e5e5e5] cursor-pointer text-sm font-bold tracking-[0.5px] text-[#333] transition-colors duration-200 hover:text-blue-600" 
                    onClick={() => setActivePanel(panel.id)}
                >
                    <span>{panel.label}</span>
                    <span className="text-xl leading-none">&gt;</span>
                </div>
            ))}
        </div>
      )}

      {CustomSections.length > 0 && (
        <div className="mt-8">
            {CustomSections.map((SectionComponent, index) => (
                <SectionComponent key={`custom-section-${index}`} />
            ))}
        </div>
      )}

      {videoData  && (
        <section className="mt-16 border-t border-[#eaeaea] pt-12">
            <h2 className="text-center text-[2rem] font-bold mb-8">From Wobbles to Woo-hoos!</h2>
            <LazyLoadYouTube videoId={videoData.id} title={product.name} />
        </section>
      )}
      
      <div className="mt-8">
        {product.description && (
            <section className="mt-16 border-t border-[#eaeaea] pt-12">
                <h2 className="text-center text-[2rem] font-bold mb-8">Description</h2>
                <div className="prose prose-slate max-w-none break-words overflow-hidden w-full [&>img]:max-w-full [&>img]:h-auto [&_p]:break-words [&_a]:break-all" dangerouslySetInnerHTML={{ __html: product.description }} />
            </section>
        )}

        {(product.weight || (product.length && product.width && product.height) || (product.attributes && product.attributes.nodes.length > 0)) && (
            <section className="mt-16 border-t border-[#eaeaea] pt-12">
                <h2 className="text-center text-[2rem] font-bold mb-8">Additional Information</h2>
                <div className="leading-[1.8] text-[#333] max-w-[800px] mx-auto bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <table className="w-full border-collapse text-sm md:text-base [&_th]:text-left [&_th]:p-3 [&_th]:border-b [&_th]:border-gray-200 [&_th]:w-[30%] [&_th]:text-gray-600 [&_th]:font-semibold [&_td]:p-3 [&_td]:border-b [&_td]:border-gray-200 [&_td]:text-gray-900 [&_tr:last-child_th]:border-none [&_tr:last-child_td]:border-none">
                        <tbody>
                            {product.weight && (
                                <tr>
                                    <th>Weight</th>
                                    <td className="font-medium">{product.weight} kg</td>
                                </tr>
                            )}

                            {product.length && product.width && product.height && (
                                <tr>
                                    <th>Dimensions</th>
                                    <td className="font-medium">{`${product.length} × ${product.width} × ${product.height} cm`}</td>
                                </tr>
                            )}

                            {product.attributes?.nodes.map((attr, index) => (
                                <tr key={index}>
                                    <th>{attr.name}</th>
                                    <td className="font-medium capitalize">{attr.options.join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        )}
        
        {/* Review Section */}
        <section id="reviews" className="mt-16 border-t border-[#eaeaea] pt-12">
            <h2 className="text-center text-[2rem] font-bold mb-8">Customer Reviews</h2>
            <ReviewForm 
                productId={product.databaseId}
                averageRating={product.averageRating ?? 0}
                reviewCount={product.reviewCount ?? 0}
                reviews={product.reviews?.edges || []}
            />
        </section>

        {product.related && product.related.nodes.length > 0 && (
            <div className="mt-16 border-t border-[#eaeaea] pt-12">
            <h2 className="text-center text-[2rem] font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {product.related.nodes.map(relatedProduct => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct as any} />
                ))}
            </div>
            </div>
        )}

        {/* === Slide Panel & Sticky Cart === */}
        <SlideOutPanel isOpen={!!activePanelConfig} onClose={() => setActivePanel(null)} title={activePanelConfig?.label || ''} >
                {PanelContentComponent && <PanelContentComponent product={product as any} />}
        </SlideOutPanel>
        
        <StickyAddToCart 
            product={productForCart} 
            isVisible={isStickyVisible} 
            isValid={!isSelectionMissing} 
        />
      </div>
    </div>
   );
}