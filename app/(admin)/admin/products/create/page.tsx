// app/admin/products/create/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { createProduct, updateProduct } from "@/app/actions/admin/product/create-update-product";
import { getProductById } from "@/app/actions/admin/product/product-read";
import { ProductFormData } from "./types";

// Components Imports
import Header from "@/app/(admin)/admin/products/create/_components/header";
import Description from "@/app/(admin)/admin/products/create/_components/description";
import ShortDescription from "@/app/(admin)/admin/products/create/_components/short_description";
import General from "@/app/(admin)/admin/products/create/_components/General";
import Inventory from "@/app/(admin)/admin/products/create/_components/Inventory";
import Shipping from "@/app/(admin)/admin/products/create/_components/Shipping";
import Attributes from "@/app/(admin)/admin/products/create/_components/Attributes";
import Variations from "@/app/(admin)/admin/products/create/_components/Variations";
import Advanced from "@/app/(admin)/admin/products/create/_components/Advanced";
import Publish from "@/app/(admin)/admin/products/create/_components/Publish";
import Categories from "@/app/(admin)/admin/products/create/_components/categoris";
import Collections from "@/app/(admin)/admin/products/create/_components/Collections";
import Brand from "@/app/(admin)/admin/products/create/_components/Brand"; 
import Tag from "@/app/(admin)/admin/products/create/_components/tag";
import ProductImage from "@/app/(admin)/admin/products/create/_components/Product_image";
import GalleryImages from "@/app/(admin)/admin/products/create/_components/Gallery_images";
import LinkedProducts from "@/app/(admin)/admin/products/create/_components/LinkedProducts";
// 🔥 NEW COMPONENT IMPORT
import BundleItems from "@/app/(admin)/admin/products/create/_components/BundleItems"; 

export default function CreateProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // --- INITIAL STATE ---
  const [formData, setFormData] = useState<ProductFormData>({
    id: "",
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    productType: "SIMPLE", // Default
    status: "draft",
    isVirtual: false,
    isDownloadable: false,
    isFeatured: false, // 🔥 Added Featured Flag
    
    // Media & SEO
    videoUrl: "",
    videoThumbnail: "",
    gender: "",
    ageGroup: "",
    metafields: "",
    seoSchema: "",

    // Bundle
    bundleItems: [], // 🔥 Added Bundle Items

    // Pricing
    price: "",
    salePrice: "",
    costPerItem: "", 
    
    // Tax & Inventory
    taxStatus: "taxable",
    taxRateId: "",
    shippingClassId: "",
    sku: "",
    barcode: "",
    trackQuantity: true,
    stock: 0,
    lowStockThreshold: 2,
    backorderStatus: "DO_NOT_ALLOW",
    soldIndividually: false,
    mpn: "",

    // Shipping
    weight: "",
    length: "",
    width: "",
    height: "",
    hsCode: "",
    countryOfManufacture: "",
    isDangerousGood: false,
    
    // Relations
    category: "",
    vendor: "",
    tags: [],
    collectionIds: [],
    featuredImage: null,
    galleryImages: [],
    digitalFiles: [],
    attributes: [],
    variations: [],
    upsells: [],
    crossSells: [],
    
    // Others
    metaTitle: "",
    metaDesc: "",
    seoCanonicalUrl: "",
    purchaseNote: "",
    menuOrder: 0,
    enableReviews: true, 
    
    saleStart: "",
    saleEnd: "",
    downloadLimit: "",
    downloadExpiry: "",
  });

  const updateData = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => {
        const newValue = typeof value === 'function' ? value(prev[field]) : value;
        return { ...prev, [field]: newValue };
    });
  };

  // --- DATA FETCHING (EDIT MODE) ---
  useEffect(() => {
    if (productId) {
      const fetchData = async () => {
        setFetching(true);
        const res = await getProductById(productId);
        if (res.success && res.product) {
          const p = res.product as any;
          setFormData({
            ...formData,
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description || "",
            shortDescription: p.shortDescription || "",
            productType: p.productType.toLowerCase(),
            status: p.status.toLowerCase(),
            isFeatured: p.isFeatured || false,
            
            // Map New Schema Fields
            videoUrl: p.videoUrl || "",
            videoThumbnail: p.videoThumbnail || "",
            gender: p.gender || "",
            ageGroup: p.ageGroup || "",
            metafields: p.metafields ? JSON.stringify(p.metafields, null, 2) : "",
            seoSchema: p.seoSchema ? JSON.stringify(p.seoSchema, null, 2) : "",

            isVirtual: p.isVirtual,
            isDownloadable: p.isDownloadable,
            price: p.price,
            salePrice: p.salePrice || "",
            costPerItem: p.costPerItem || "",
            
            taxStatus: p.taxStatus ? p.taxStatus.toLowerCase() : "taxable",
            taxRateId: p.taxRateId || "",
            shippingClassId: p.shippingClassId || "",
            seoCanonicalUrl: p.seoCanonicalUrl || "",
            collectionIds: p.collections ? p.collections.map((c:any) => c.id) : [],
            digitalFiles: p.downloadFiles ? p.downloadFiles.map((d:any) => ({ name: d.name, url: d.url })) : [],
            sku: p.sku || "",
            barcode: p.barcode || "",
            trackQuantity: p.trackQuantity,
            stock: p.stock || 0,
            weight: p.weight?.toString() || "",
            length: p.length?.toString() || "",
            width: p.width?.toString() || "",
            height: p.height?.toString() || "",
            category: p.category?.name || "",
            vendor: p.brand?.name || "",
            tags: p.tags ? p.tags.map((t: any) => t.name) : [],
            featuredImage: p.featuredImage,
            galleryImages: p.images ? p.images.map((img: any) => img.url) : [],
            metaTitle: p.metaTitle || "",
            metaDesc: p.metaDesc || "",
            purchaseNote: p.purchaseNote || "",
            menuOrder: p.menuOrder || 0,
            enableReviews: p.enableReviews,
            upsells: p.upsellIds || [],
            crossSells: p.crossSellIds || [],
            
            // Map Attributes with Position
            attributes: p.attributes ? p.attributes.map((a: any) => ({
              id: a.id, name: a.name, values: a.values, visible: a.visible, variation: a.variation, position: a.position || 0
            })) : [],
            
            // Map Variations with Advanced Fields
            variations: p.variants ? p.variants.map((v: any) => ({
              id: v.id, 
              name: v.name, 
              price: v.price, 
              stock: v.stock, 
              sku: v.sku || "", 
              attributes: v.attributes || {},
              barcode: v.barcode || "",
              costPerItem: v.costPerItem || 0,
              weight: v.weight || 0,
              length: v.length || 0,
              width: v.width || 0,
              height: v.height || 0,
              image: v.image || ""
            })) : [],

            // 🔥 Map Bundle Items
            bundleItems: p.bundleItems ? p.bundleItems.map((b: any) => ({
                childProductId: b.childProductId,
                childProductName: b.childProduct?.name || "Unknown Product",
                childProductImage: b.childProduct?.featuredImage || b.childProduct?.images?.[0]?.url,
                quantity: b.quantity
            })) : [],
            
            lowStockThreshold: p.lowStockThreshold || 2,
            backorderStatus: p.backorderStatus || "DO_NOT_ALLOW",
            soldIndividually: p.soldIndividually || false,
            mpn: p.mpn || "",
            hsCode: p.hsCode || "",
            countryOfManufacture: p.countryOfManufacture || "",
            isDangerousGood: p.isDangerousGood || false,

            saleStart: p.saleStart ? new Date(p.saleStart).toISOString().split('T')[0] : "",
            saleEnd: p.saleEnd ? new Date(p.saleEnd).toISOString().split('T')[0] : "",
            downloadLimit: p.downloadLimit === -1 ? "" : p.downloadLimit,
            downloadExpiry: p.downloadExpiry === -1 ? "" : p.downloadExpiry,
          });
        }
        setFetching(false);
      };
      fetchData();
    }
  }, [productId]);

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(productId ? "Updating..." : "Publishing...");

    const submitData = new FormData();
    if(productId) submitData.append("id", productId);
    
    // Loop through all keys and append to FormData
    Object.keys(formData).forEach(key => {
        const value = formData[key as keyof ProductFormData];
        if (['galleryImages', 'tags', 'attributes', 'variations', 'upsells', 'crossSells', 'collectionIds', 'digitalFiles', 'bundleItems'].includes(key)) {
            submitData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
            submitData.append(key, String(value));
        }
    });
    
    // Explicit check for costPerItem because it might be 0
    if(formData.costPerItem !== "") submitData.append('cost', String(formData.costPerItem));

    try {
        const action = productId ? updateProduct : createProduct;
        const result = await action(submitData);
        if (result.success) {
            toast.success(productId ? "Updated successfully!" : "Product published!", { id: toastId });
            router.push("/admin/products");
            router.refresh();
        } else {
            toast.error(result.message || "Error saving product", { id: toastId });
        }
    } catch (error) {
        console.error(error);
        toast.error("Something went wrong", { id: toastId });
    } finally {
        setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex h-screen items-center justify-center bg-[#f0f0f1]">
        <div className="text-[#3c434a] font-medium">Loading product data...</div>
    </div>
  );

  return (
    <div className=" m-1 min-h-screen bg-[#f0f0f1] font-sans text-sm text-[#3c434a] relative">
        <Header loading={loading} onSubmit={handleSubmit} title={formData.name} isEdit={!!productId} />
        <div className="w-full p-0 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-5">
            
            {/* --- LEFT COLUMN --- */}
            <div className="flex-1 min-w-0 space-y-4 md:space-y-5">
                <div className="space-y-2 px-4 md:px-0 mt-4 md:mt-0">
                    <input 
                        value={formData.name} 
                        onChange={(e) => {
                            updateData('name', e.target.value);
                            if (!productId || !formData.slug) {
                                const newSlug = e.target.value.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                                updateData('slug', newSlug);
                            }
                        }}
                        placeholder="Product Name"
                        className="w-full px-3 py-2 border border-gray-400 text-lg rounded-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none shadow-sm"
                    />
                      {formData.name && (
                        <div className="text-xs flex flex-wrap items-center gap-1 text-[#646970] leading-relaxed">
                            <span className="font-semibold whitespace-nowrap">Permalink:</span>
                            <span className="break-all">
                                {typeof window !== 'undefined' ? window.location.origin : ''}/product/
                            </span>
                            <input 
                                value={formData.slug}
                                onChange={(e) => updateData('slug', e.target.value)}
                                className="bg-transparent border border-transparent hover:border-gray-400 px-1 rounded text-xs text-[#3c434a] font-medium focus:border-[#2271b1] outline-none min-w-[50px] max-w-full"
                            />
                        </div>
                      )}
                </div>
                
                <ShortDescription data={formData} updateData={updateData} />
                <Description data={formData} updateData={updateData} />

                {/* --- PRODUCT DATA BOX --- */}
                <div className="bg-white border-y md:border border-gray-300 md:rounded-sm shadow-sm">
                    
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50 gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-[#1d2327]">Product Data</span>
                            <span className="text-gray-300 hidden sm:inline">|</span>
                            <select 
                                value={formData.productType} 
                                onChange={(e) => updateData('productType', e.target.value)}
                                className="border border-gray-300 rounded-sm px-2 py-1 text-xs focus:border-[#2271b1] outline-none font-medium text-[#3c434a]"
                            >
                                <option value="simple">Simple product</option>
                                <option value="variable">Variable product</option>
                                {/* 🔥 Bundle Option Available Here */}
                                <option value="bundle">Product Bundle</option> 
                                <option value="grouped">Grouped product</option>
                                <option value="external">External/Affiliate product</option>
                            </select>
                        </div>
                        <div className="flex gap-4 text-xs text-[#3c434a]">
                            <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input type="checkbox" checked={formData.isVirtual} onChange={e=>updateData('isVirtual', e.target.checked)}/> Virtual
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input type="checkbox" checked={formData.isDownloadable} onChange={e=>updateData('isDownloadable', e.target.checked)}/> Downloadable
                            </label>
                        </div>
                    </div>

                    {/* Tabs & Content */}
                    <div className="flex flex-col md:flex-row min-h-[300px]">
                        {/* Sidebar Tabs */}
                        <ul className="w-full md:w-44 bg-gray-100 border-b md:border-b-0 md:border-r border-gray-300 pt-1 shrink-0 flex md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
                            {[
                                {id: 'general', label: 'General', show: formData.productType !== 'bundle'}, 
                                {id: 'inventory', label: 'Inventory', show: true},
                                {id: 'shipping', label: 'Shipping', show: !formData.isVirtual},
                                {id: 'linked', label: 'Linked Products', show: true},
                                {id: 'attributes', label: 'Attributes', show: true},
                                {id: 'variations', label: 'Variations', show: formData.productType === 'variable'},
                                {id: 'bundle', label: 'Bundle Items', show: formData.productType === 'bundle'}, 
                                {id: 'advanced', label: 'Advanced', show: true},
                            ].map(tab => tab.show && (
                                <li key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`cursor-pointer px-4 py-3 md:py-2.5 border-r md:border-r-0 md:border-b border-gray-200 text-xs flex justify-between items-center transition-colors whitespace-nowrap
                                    ${activeTab === tab.id 
                                        ? 'bg-white font-bold text-[#3c434a] md:border-r-white md:-mr-[1px] border-b-white md:border-b-gray-200' 
                                        : 'text-[#2271b1] hover:bg-gray-50 hover:text-[#135e96]'}`}
                                >
                                    {tab.label}
                                </li>
                            ))}
                        </ul>

                        {/* Content Area */}
                        <div className="flex-1 p-5 bg-white">
                            {activeTab === 'general' && <General data={formData} updateData={updateData} />}
                            {activeTab === 'inventory' && <Inventory data={formData} updateData={updateData} />}
                            {activeTab === 'shipping' && <Shipping data={formData} updateData={updateData} />}
                            {activeTab === 'attributes' && <Attributes data={formData} updateData={updateData} onSubmit={handleSubmit} loading={loading} />}
                            {activeTab === 'variations' && <Variations data={formData} updateData={updateData} />}
                            {/* 🔥 RENDER BUNDLE COMPONENT */}
                            {activeTab === 'bundle' && <BundleItems data={formData} updateData={updateData} />}
                            {activeTab === 'advanced' && <Advanced data={formData} updateData={updateData} />}
                            {activeTab === 'linked' && <LinkedProducts data={formData} updateData={updateData} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN (Sidebar) --- */}
            <div className="w-full lg:w-[280px] space-y-4 md:space-y-5 shrink-0 px-4 md:px-0 pb-10 md:pb-0">
                <Publish data={formData} updateData={updateData} loading={loading} onSubmit={handleSubmit} />
                <Categories data={formData} updateData={updateData} />
                <Collections data={formData} updateData={updateData} />
                <ProductImage data={formData} updateData={updateData} />
                <GalleryImages data={formData} updateData={updateData} />
                <Brand data={formData} updateData={updateData} /> 
                <Tag data={formData} updateData={updateData} />
            </div>
        </div>
    </div>
  );
}