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
    }, 1000); // Debounce 1s

    return () => clearTimeout(handler);
  }, [formValues, isDirty]);

  // --- 2. Check for Draft on Mount ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Don't restore if editing a different product
          if (isEdit && parsed.id !== initialData.id) return;
          if (!isEdit && parsed.id) return; // Don't restore edit draft to create page

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
          localStorage.removeItem(STORAGE_KEY); // Clear draft on success
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
        <div className="m-1 min-h-screen bg-[#f0f0f1] font-sans text-sm text-[#3c434a] relative">
            <input type="hidden" {...methods.register("version")} />
            {/* Draft Recovery Alert */}
            {hasDraft && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                    <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Unsaved changes found from your last session.</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={restoreDraft} className="px-3 py-1 bg-yellow-600 text-white rounded text-xs font-bold hover:bg-yellow-700 flex items-center gap-1">
                            <RefreshCw size={12}/> Restore
                        </button>
                        <button onClick={discardDraft} className="px-3 py-1 bg-white border border-yellow-300 text-yellow-800 rounded text-xs font-bold hover:bg-yellow-50">
                            Discard
                        </button>
                    </div>
                </div>
            )}

            <Header 
                loading={isSubmitting || isPending} 
                onSubmit={handleSubmit(onSubmit)} 
                title={watch("name")} 
                isEdit={isEdit} 
            />
            
            <div className="w-full p-0 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-5">
                
                <div className="flex-1 min-w-0 space-y-4 md:space-y-5">
                    <div className="space-y-2 px-4 md:px-0 mt-4 md:mt-0">
                        <input 
                            {...methods.register("name")}
                            placeholder="Product Name"
                            className="w-full px-3 py-2 border border-gray-400 text-lg rounded-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none shadow-sm"
                        />
                        {methods.watch("name") && (
                            <div className="text-xs flex flex-wrap items-center gap-1 text-[#646970] leading-relaxed">
                                <span className="font-semibold whitespace-nowrap">Permalink:</span>
                                <span className="break-all">
                                    {typeof window !== 'undefined' ? window.location.origin : ''}/product/
                                </span>
                                <input 
                                    {...methods.register("slug", {
                                        onChange: (e) => {
                                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                                            setValue("slug", val, { shouldDirty: true });
                                        }
                                    })}
                                    className="bg-transparent border border-transparent hover:border-gray-400 px-1 rounded text-xs text-[#3c434a] font-medium focus:border-[#2271b1] outline-none min-w-[50px] max-w-full"
                                />
                            </div>
                        )}
                    </div>
                    
                    <ShortDescription />
                    <Description />

                    <div className="bg-white border-y md:border border-gray-300 md:rounded-sm shadow-sm">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50 gap-3 sm:gap-0">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-[#1d2327]">Product Data</span>
                                <span className="text-gray-300 hidden sm:inline">|</span>
                                <select 
                                    {...methods.register("productType")}
                                    className="border border-gray-300 rounded-sm px-2 py-1 text-xs focus:border-[#2271b1] outline-none font-medium text-[#3c434a]"
                                >
                                    <option value="SIMPLE">Simple product</option>
                                    <option value="VARIABLE">Variable product</option>
                                    <option value="BUNDLE">Product Bundle</option> 
                                    <option value="GIFT_CARD">Gift Card</option>
                                </select>
                            </div>
                            <div className="flex gap-4 text-xs text-[#3c434a]">
                                <label className="flex items-center gap-1 cursor-pointer select-none">
                                    <input type="checkbox" {...methods.register("isVirtual")}/> Virtual
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none">
                                    <input type="checkbox" {...methods.register("isDownloadable")}/> Downloadable
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row min-h-[400px]">
                            <ul className="w-full md:w-44 bg-gray-100 border-b md:border-b-0 md:border-r border-gray-300 pt-1 shrink-0 flex md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
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
                                        className={`cursor-pointer px-4 py-3 md:py-2.5 border-r md:border-r-0 md:border-b border-gray-200 text-xs flex justify-between items-center transition-colors whitespace-nowrap
                                        ${activeTab === tab.id 
                                            ? 'bg-white font-bold text-[#3c434a] md:border-r-white md:-mr-[1px] border-b-white md:border-b-gray-200' 
                                            : 'text-[#2271b1] hover:bg-gray-50 hover:text-[#135e96]'}`}
                                    >
                                        {tab.label}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex-1 p-5 bg-white">
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
                </div>

                <div className="w-full lg:w-[280px] space-y-4 md:space-y-5 shrink-0 px-4 md:px-0 pb-10 md:pb-0">
                    <Publish isEdit={isEdit} loading={isSubmitting || isPending} onSubmit={handleSubmit(onSubmit)} />
                    <Categories />
                    <Collections />
                    <ProductImage />
                    <GalleryImages />
                    <Brand /> 
                    <Tag />
                </div>
            </div>
        </div>
    </FormProvider>
  );
}