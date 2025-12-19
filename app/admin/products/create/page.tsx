"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { ProductFormData } from "./types";
import { createProduct, updateProduct, getProductById } from "@/app/actions/product";

// Components Imports
import Header from "@/app/admin/products/create/_components/header";
import Description from "@/app/admin/products/create/_components/description";
import ShortDescription from "@/app/admin/products/create/_components/short_description";
import General from "@/app/admin/products/create/_components/General";
import Inventory from "@/app/admin/products/create/_components/Inventory";
import Shipping from "@/app/admin/products/create/_components/Shipping";
import Attributes from "@/app/admin/products/create/_components/Attributes";
import Variations from "@/app/admin/products/create/_components/Variations";
import Advanced from "@/app/admin/products/create/_components/Advanced";
import Publish from "@/app/admin/products/create/_components/Publish";
import Categories from "@/app/admin/products/create/_components/categoris";
import Brand from "@/app/admin/products/create/_components/Brand"; 
import Tag from "@/app/admin/products/create/_components/tag";
import ProductImage from "@/app/admin/products/create/_components/Product_image";
import GalleryImages from "@/app/admin/products/create/_components/Gallery_images";
import LinkedProducts from "@/app/admin/products/create/_components/LinkedProducts";

export default function CreateProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Initial Form State
  const [formData, setFormData] = useState<ProductFormData>({
    name: "", 
    slug: "", 
    description: "", 
    shortDescription: "",
    productType: "simple", 
    status: "draft",
    isVirtual: false, 
    isDownloadable: false,
    price: "", 
    salePrice: "", 
    cost: "", 
    taxStatus: "taxable",
    sku: "", 
    barcode: "", 
    trackQuantity: true, 
    stock: 0,
    weight: "", 
    length: "", 
    width: "", 
    height: "",
    category: "", 
    vendor: "", 
    tags: [],
    featuredImage: null, 
    galleryImages: [],
    attributes: [], 
    variations: [],
    upsells: [],    // Added
    crossSells: [], // Added
    metaTitle: "", 
    metaDesc: "", 
    purchaseNote: "", 
    menuOrder: 0, 
    enableReviews: true
  });

  // Helper to update state
  const updateData = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch Data for Edit Mode
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
            status: p.status,
            isVirtual: p.isVirtual,
            isDownloadable: p.isDownloadable,
            price: p.price,
            salePrice: p.salePrice || "",
            cost: p.costPerItem || "",
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
            // Mapping Linked Products (assuming API returns arrays of names/ids)
            upsells: p.upsellIds || [],
            crossSells: p.crossSellIds || [],
            attributes: p.attributes ? p.attributes.map((a: any) => ({
              id: a.id, name: a.name, values: a.values, visible: a.visible, variation: a.variation
            })) : [],
            variations: p.variants ? p.variants.map((v: any) => ({
              id: v.id, name: v.name, price: v.price, stock: v.stock, sku: v.sku || "", attributes: v.attributes || {}
            })) : []
          });
        }
        setFetching(false);
      };
      fetchData();
    }
  }, [productId]);

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(productId ? "Updating..." : "Publishing...");

    const submitData = new FormData();
    if(productId) submitData.append("id", productId);
    
    // Append all fields to FormData
    Object.keys(formData).forEach(key => {
        const value = formData[key as keyof ProductFormData];
        // JSON Stringify complex arrays
        if (['galleryImages', 'tags', 'attributes', 'variations', 'upsells', 'crossSells'].includes(key)) {
            submitData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
            submitData.append(key, String(value));
        }
    });

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

                <Description data={formData} updateData={updateData} />

                {/* PRODUCT DATA TABS BOX */}
                <div className="bg-white border-y md:border border-gray-300 md:rounded-sm shadow-sm">
                    {/* Data Header */}
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
                                <option value="grouped">Grouped product</option>
                                <option value="external">External/Affiliate product</option>
                                <option value="variable">Variable product</option>
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
                                {id: 'general', label: 'General', show: true},
                                {id: 'inventory', label: 'Inventory', show: true},
                                {id: 'shipping', label: 'Shipping', show: !formData.isVirtual},
                                {id: 'linked', label: 'Linked Products', show: true},
                                {id: 'attributes', label: 'Attributes', show: true},
                                {id: 'variations', label: 'Variations', show: formData.productType === 'variable'},
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

                        {/* Tab Content Area */}
                        <div className="flex-1 p-5 bg-white">
                            {activeTab === 'general' && <General data={formData} updateData={updateData} />}
                            {activeTab === 'inventory' && <Inventory data={formData} updateData={updateData} />}
                            {activeTab === 'shipping' && <Shipping data={formData} updateData={updateData} />}
                            {activeTab === 'attributes' && <Attributes data={formData} updateData={updateData} />}
                            {activeTab === 'variations' && <Variations data={formData} updateData={updateData} />}
                            {activeTab === 'advanced' && <Advanced data={formData} updateData={updateData} />}
                            {activeTab === 'linked' && <LinkedProducts data={formData} updateData={updateData} />}
                        </div>
                    </div>
                </div>

                <ShortDescription data={formData} updateData={updateData} />
            </div>

            {/* RIGHT COLUMN (Sidebar) */}
            <div className="w-full lg:w-[280px] space-y-4 md:space-y-5 shrink-0 px-4 md:px-0 pb-10 md:pb-0">
                <Publish data={formData} updateData={updateData} loading={loading} onSubmit={handleSubmit} />
                <Categories data={formData} updateData={updateData} />
                <ProductImage data={formData} updateData={updateData} />
                <GalleryImages data={formData} updateData={updateData} />
                <Brand data={formData} updateData={updateData} /> 
                <Tag data={formData} updateData={updateData} />
            </div>
        </div>
    </div>
  );
}