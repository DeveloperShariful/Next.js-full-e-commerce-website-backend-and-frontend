// File: app/admin/products/create/_components/ProductForm.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { productSchema, ProductFormValues } from "../schema";
import { createProduct, updateProduct } from "@/app/actions/admin/product/create-update-product";

import Header from "./header";
import General from "./General";
import Inventory from "./Inventory";
import Shipping from "./Shipping";
import Attributes from "./Attributes";
import Variations from "./Variations";
import Advanced from "./Advanced";
import Publish from "./Publish";
import Categories from "./categoris";
import Collections from "./Collections";
import Brand from "./Brand";
import Tag from "./tag";
import ProductImage from "./Product_image";
import GalleryImages from "./Gallery_images";
import LinkedProducts from "./LinkedProducts";
import BundleItems from "./BundleItems";
import Description from "./description";
import ShortDescription from "./short_description";

interface ProductFormProps {
  initialData: ProductFormValues;
  isEdit: boolean;
}

const STORAGE_KEY = "product_form_draft";

export function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("general");
  const [hasDraft, setHasDraft] = useState(false);

  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData as any,
    mode: "onChange",
  });

  const { handleSubmit, watch, reset, setValue, formState: { isSubmitting, isDirty } } = methods;
  
  const productType = watch("productType");
  const isVirtual = watch("isVirtual");
  const formValues = watch();

  // --- 1. Auto-Save Logic (Local Storage) ---
  useEffect(() => {
    if (!isDirty) return;
    
    const handler = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
    }, 1000); 

    return () => clearTimeout(handler);
  }, [formValues, isDirty]);

  // --- 2. Check for Draft on Mount ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (isEdit && parsed.id !== initialData.id) return;
          if (!isEdit && parsed.id) return; 

          setHasDraft(true);
        } catch (e) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [isEdit, initialData.id]);

  const restoreDraft = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      reset(parsed);
      setHasDraft(false);
      toast.success("Draft restored from local storage");
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
    toast.success("Draft discarded");
  };

  // --- 3. Submit Handler ---
  const onSubmit = async (data: ProductFormValues) => {
    if (isEdit && !isDirty) {
        toast.success("No changes detected.");
        return;
    }

    const toastId = toast.loading(isEdit ? "Updating..." : "Publishing...");
    
    const formData = new FormData();
    if (isEdit && initialData.id) formData.append("id", initialData.id);

    Object.keys(data).forEach((key) => {
        const value = (data as any)[key];
        
        if (['galleryImages', 'tags', 'attributes', 'variations', 'upsells', 'crossSells', 'collectionIds', 'digitalFiles', 'bundleItems', 'inventoryData', 'metafields', 'seoSchema', 'giftCardAmounts'].includes(key)) {
            formData.append(key, JSON.stringify(value));
        } 
        else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    startTransition(async () => {
      try {
        const action = isEdit ? updateProduct : createProduct;
        const result = await action(formData);

        if (result.success) {
          localStorage.removeItem(STORAGE_KEY); 
          toast.success(isEdit ? "Updated successfully!" : "Product published!", { id: toastId });
          router.push("/admin/products");
          router.refresh();
        } else {
          toast.error(result.message || "Error saving product", { id: toastId });
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong", { id: toastId });
      }
    });
  };

  return (
    <FormProvider {...methods}>
        {/* 🚀 WP Style Background & Font Base */}
        <div className="min-h-screen bg-[#f0f0f1] font-sans text-[13px] text-[#3c434a] relative pb-1">
            <input type="hidden" {...methods.register("version")} />
            
            {/* 🚀 WP Style Notice / Alert Box */}
            {hasDraft && (
                <div className="bg-white border-l-4 border-[#d63638] px-4 py-3 shadow-sm mx-4 md:mx-1 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#1d2327]">
                        <AlertTriangle size={16} className="text-[#d63638]" />
                        <span className="font-medium text-[13px]">Unsaved changes found from your last session.</span>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={restoreDraft} className="px-3 py-1 bg-white border border-[#c3c4c7] text-[#2271b1] rounded-sm text-[12px] hover:bg-[#f6f7f7] hover:text-[#0a4b78] transition-colors flex items-center gap-1 shadow-sm">
                            <RefreshCw size={12}/> Restore
                        </button>
                        <button type="button" onClick={discardDraft} className="px-3 py-1 bg-white border border-[#c3c4c7] text-[#d63638] rounded-sm text-[12px] hover:bg-[#fef2f2] transition-colors shadow-sm">
                            Discard
                        </button>
                    </div>
                </div>
            )}

            {/* 🚀 Simple Page Title (No Save Buttons here in WP) */}
            <Header 
                loading={isSubmitting || isPending} 
                onSubmit={handleSubmit(onSubmit)} 
                title={watch("name")} 
                isEdit={isEdit} 
            />
            
            {/* 🚀 WP Style Two-Column Layout */}
            <div className="w-full px-1 md:px-1 py-1 flex flex-col lg:flex-row gap-5 items-start">
                
                {/* =======================================
                    LEFT COLUMN: MAIN CONTENT (70%)
                ======================================= */}
                <div className="flex-1 w-full min-w-0 space-y-4">
                    
                    {/* 🚀 Product Title & Permalink */}
                    <div className="space-y-1">
                        <input 
                            {...methods.register("name")}
                            placeholder="Product Name"
                            className="w-full px-3 py-2 bg-white border border-[#8c8f94] text-[18px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-[3px] transition-shadow"
                        />
                        {methods.watch("name") && (
                            <div className="text-[12px] flex flex-wrap items-center gap-1 text-[#646970] mt-1 ml-1">
                                <span className="font-semibold text-[#50575e]">Permalink:</span>
                                <span className="text-[#2271b1]">
                                    {typeof window !== 'undefined' ? window.location.origin : ''}/product/
                                </span>
                                <input 
                                    {...methods.register("slug", {
                                        onChange: (e) => {
                                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                                            setValue("slug", val, { shouldDirty: true });
                                        }
                                    })}
                                    className="bg-transparent border border-transparent hover:border-[#8c8f94] px-1 py-0.5 rounded-sm text-[12px] text-[#2271b1] underline focus:border-[#2271b1] outline-none min-w-[50px]"
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Main Description */}
                    <Description />

                    {/* 🚀 WooCommerce "Product Data" Meta Box */}
                    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
                        
                        {/* Box Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center px-3 py-2 border-b border-[#c3c4c7] bg-white gap-3 sm:gap-4">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#1d2327] text-[14px]">Product data</span>
                                <span className="text-[#c3c4c7]">—</span>
                                <select 
                                    {...methods.register("productType")}
                                    className="border border-[#8c8f94] rounded-[3px] px-2 py-0.5 text-[13px] focus:border-[#2271b1] outline-none text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
                                >
                                    <option value="SIMPLE">Simple product</option>
                                    <option value="VARIABLE">Variable product</option>
                                    <option value="BUNDLE">Product Bundle</option> 
                                    <option value="GIFT_CARD">Gift Card</option>
                                </select>
                            </div>
                            <div className="flex gap-4 text-[12px] text-[#3c434a]">
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                    <input type="checkbox" {...methods.register("isVirtual")} className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" /> Virtual
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                    <input type="checkbox" {...methods.register("isDownloadable")} className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" /> Downloadable
                                </label>
                            </div>
                        </div>

                        {/* 🚀 WooCommerce Style Vertical Tabs */}
                        <div className="flex flex-col md:flex-row min-h-[400px]">
                            {/* Left Side: Tabs */}
                            <ul className="w-full md:w-[150px] bg-[#f6f7f7] border-b md:border-b-0 md:border-r border-[#c3c4c7] shrink-0 flex md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
                                {[
                                    {id: 'general', label: 'General', show: productType !== 'BUNDLE'}, 
                                    {id: 'inventory', label: 'Inventory', show: true},
                                    {id: 'shipping', label: 'Shipping', show: !isVirtual},
                                    {id: 'linked', label: 'Linked Products', show: true},
                                    {id: 'attributes', label: 'Attributes', show: true},
                                    {id: 'variations', label: 'Variations', show: productType === 'VARIABLE'},
                                    {id: 'bundle', label: 'Bundle Items', show: productType === 'BUNDLE'}, 
                                    {id: 'advanced', label: 'Advanced', show: true},
                                ].map(tab => tab.show && (
                                    <li key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`cursor-pointer px-3 py-2.5 text-[13px] transition-colors border-b border-[#f0f0f1] whitespace-nowrap md:whitespace-normal
                                        ${activeTab === tab.id 
                                            ? 'bg-white font-semibold text-[#1d2327] md:border-r-0 md:-mr-[1px] relative z-10' 
                                            : 'text-[#2271b1] hover:text-[#0a4b78] bg-transparent'}`}
                                    >
                                        {tab.label}
                                    </li>
                                ))}
                            </ul>

                            {/* Right Side: Tab Content */}
                            <div className="flex-1 p-4 bg-white relative z-0">
                                {activeTab === 'general' && <General />}
                                {activeTab === 'inventory' && <Inventory />}
                                {activeTab === 'shipping' && <Shipping />}
                                {activeTab === 'attributes' && <Attributes />}
                                {activeTab === 'variations' && <Variations />}
                                {activeTab === 'bundle' && <BundleItems />}
                                {activeTab === 'advanced' && <Advanced />}
                                {activeTab === 'linked' && <LinkedProducts />}
                            </div>
                        </div>
                    </div>

                    {/* Short Description */}
                    <ShortDescription />

                </div>

                {/* =======================================
                    RIGHT COLUMN: SIDEBAR WIDGETS (30%)
                ======================================= */}
                <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 space-y-4">
                    
                    {/* 🚀 WP Publish Box (Save/Update button is inside here) */}
                    <Publish isEdit={isEdit} loading={isSubmitting || isPending} onSubmit={handleSubmit(onSubmit)} />
                    
                    {/* Sub Widgets */}
                    <Categories />
                    <Collections />
                    <Brand /> 
                    <Tag />
                    <ProductImage />
                    <GalleryImages />
                    
                </div>
            </div>
        </div>
    </FormProvider>
  );
}