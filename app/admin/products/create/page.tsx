// app/admin/products/create/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ImageUpload from "@/components/ui/image-upload";
import { createProduct, getProductById } from "@/app/actions/product";
import { getCategories } from "@/app/actions/category";
import { getAttributes } from "@/app/actions/attribute"; 
import { toast } from "react-hot-toast";
import {
  Save, ArrowLeft, X, ChevronDown, ChevronUp,
  HelpCircle, Info, Calendar, Globe
} from "lucide-react";

// --- Types ---
interface Attribute {
  id: string;
  name: string;
  values: string[];
  visible: boolean;
  variation: boolean;
}

interface Variation {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface CategoryData {
  id: string;
  name: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const [openBoxes, setOpenBoxes] = useState<Record<string, boolean>>({
    publish: true, category: true, image: true, gallery: true, tags: true
  });

  // --- DATA STATES ---
  const [dbCategories, setDbCategories] = useState<CategoryData[]>([]); 
  const [globalAttributes, setGlobalAttributes] = useState<any[]>([]);

  // --- 1. BASIC INFO ---
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  // --- 2. MEDIA ---
  const [featuredImage, setFeaturedImage] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // --- 3. PRODUCT TYPE ---
  const [productType, setProductType] = useState("simple");
  const [isVirtual, setIsVirtual] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);

  // --- 4. PRICING ---
  const [price, setPrice] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [cost, setCost] = useState<number | "">("");
  const [taxStatus, setTaxStatus] = useState("taxable");

  // --- 5. INVENTORY ---
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [trackQuantity, setTrackQuantity] = useState(true);
  const [stock, setStock] = useState<number | "">(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(2);
  const [backorders, setBackorders] = useState("no");

  // --- 6. SHIPPING ---
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [shippingClass, setShippingClass] = useState("standard");

  // --- 7. LINKED PRODUCTS ---
  const [upsells, setUpsells] = useState<string[]>([]);
  const [crossSells, setCrossSells] = useState<string[]>([]);

  // --- 8. ATTRIBUTES & VARIATIONS ---
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);

  // --- 9. ADVANCED ---
  const [purchaseNote, setPurchaseNote] = useState("");
  const [menuOrder, setMenuOrder] = useState(0);
  const [enableReviews, setEnableReviews] = useState(true);

  // --- 10. ORGANIZATION ---
  const [status, setStatus] = useState("active");
  const [visibility, setVisibility] = useState("visible");
  const [publishDate, setPublishDate] = useState("");

  const [category, setCategory] = useState(""); 
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  const [vendor, setVendor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // --- 11. SEO ---
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  // --- HANDLERS ---
  const toggleBox = (box: string) => {
    setOpenBoxes(prev => ({ ...prev, [box]: !prev[box] }));
  };

  useEffect(() => {
    const initData = async () => {
      setFetching(true);
      
      try {
        const catRes = await getCategories();
        if (catRes.success) setDbCategories(catRes.data as any);

        // ✅ FIX: Added '|| []' to handle undefined data safely
        const attrRes = await getAttributes();
        if (attrRes.success) setGlobalAttributes(attrRes.data || []);

      } catch (error) {
        console.error(error);
      }

      if (productId) {
        const res = await getProductById(productId);

        if (res.success && res.product) {
          const p = res.product as any; 
          
          setName(p.name);
          setSlug(p.slug);
          setDescription(p.description || "");
          setShortDescription(p.shortDescription || "");
          
          setProductType(p.productType.toLowerCase()); 
          setIsVirtual(p.isVirtual);
          setIsDownloadable(p.isDownloadable);

          setPrice(p.price);
          setSalePrice(p.salePrice || "");
          setCost(p.costPerItem || "");
          setTaxStatus(p.taxable ? "taxable" : "none");

          setSku(p.sku || "");
          setBarcode(p.barcode || "");
          setTrackQuantity(p.trackQuantity);
          
          const totalStock = p.inventoryLevels?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0;
          setStock(totalStock);

          setWeight(p.weight?.toString() || "");
          setLength(p.length?.toString() || "");
          setWidth(p.width?.toString() || "");
          setHeight(p.height?.toString() || "");
          
          setStatus(p.status);
          if(p.category) setCategory(p.category.name);
          
          if(p.tags && p.tags.length > 0) {
              setTags(p.tags.map((t: any) => t.name));
          }

          if (p.featuredImage) setFeaturedImage([p.featuredImage]);
          if (p.images && p.images.length > 0) {
              setGalleryImages(p.images.map((img: any) => img.url));
          }

          setMetaTitle(p.metaTitle || "");
          setMetaDesc(p.metaDesc || "");
          setPurchaseNote(p.purchaseNote || "");
          setMenuOrder(p.menuOrder || 0);
          
          if (p.attributes) {
              setAttributes(p.attributes.map((a:any) => ({
                  id: a.id, name: a.name, values: a.values, visible: a.visible, variation: a.variation
              })));
          }
          toast.success("Product data loaded");
        }
      }
      setFetching(false);
    };

    initData();
  }, [productId]);

  const addAttribute = () => {
    setAttributes([...attributes, { id: Date.now().toString(), name: "", values: [], visible: true, variation: true }]);
  };

  const generateVariations = () => {
    toast.success("Variations generated (Demo Mode)!");
    const newVars: Variation[] = [
      { id: "v1", name: "Variation 1", price: Number(price), stock: 10, sku: `${sku}-1` },
    ];
    setVariations(newVars);
  };

  const handleAddCategory = () => {
    if (newCategoryInput.trim()) {
      setDbCategories([...dbCategories, { id: "new", name: newCategoryInput.trim() }]);
      setCategory(newCategoryInput.trim());
      setNewCategoryInput("");
      setIsAddingCategory(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    const toastId = toast.loading(productId ? "Updating..." : "Saving...");
    
    const formData = new FormData();

    try {
      if(productId) formData.append("id", productId);

      formData.append("name", name || "");
      formData.append("slug", slug || "");
      formData.append("description", description || "");
      formData.append("shortDescription", shortDescription || "");
      formData.append("productType", productType || "simple");
      formData.append("status", status || "draft");

      if (featuredImage[0]) formData.append("featuredImage", featuredImage[0]);
      formData.append("galleryImages", JSON.stringify(galleryImages));

      formData.append("price", (price || 0).toString());
      if (salePrice) formData.append("salePrice", salePrice.toString());
      if (cost) formData.append("cost", cost.toString());
      
      formData.append("sku", sku || "");
      formData.append("barcode", barcode || "");
      formData.append("stock", (stock || 0).toString());
      formData.append("trackQuantity", String(trackQuantity));
      formData.append("taxStatus", taxStatus);
      
      formData.append("isVirtual", String(isVirtual));
      formData.append("isDownloadable", String(isDownloadable));
      
      if (weight) formData.append("weight", weight);
      if (length) formData.append("length", length);
      if (width) formData.append("width", width);
      if (height) formData.append("height", height);

      formData.append("category", category || ""); 
      formData.append("vendor", vendor || "");
      formData.append("tags", JSON.stringify(tags));

      formData.append("attributes", JSON.stringify(attributes));
      formData.append("variations", JSON.stringify(variations));

      if (metaTitle) formData.append("metaTitle", metaTitle);
      if (metaDesc) formData.append("metaDesc", metaDesc);
      if (purchaseNote) formData.append("purchaseNote", purchaseNote);
      formData.append("menuOrder", (menuOrder || 0).toString());

      const result = productId 
        ? await createProduct(formData) 
        : await createProduct(formData);

      if (result.success) {
        toast.success(productId ? "Updated successfully!" : "Product published successfully!", { id: toastId });
        router.push("/admin/products");
      } else {
        toast.error(result.error || "Failed to save.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#f0f0f1] text-[#3c434a]">
        <div className="flex flex-col items-center gap-2">
           <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-300 border-t-[#2271b1]"></div>
           <p className="text-sm font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#f0f0f1] font-sans text-[13px] text-[#3c434a] pb-12">
      <form onSubmit={handleSubmit}>
      
        {/* HEADER */}
        <div className="px-5 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-medium text-[#1d2327]">
            {productId ? "Edit product" : "Add new product"}
            </h1>
        </div>

        <div className="max-w-full px-5 flex flex-col lg:flex-row gap-5">
            
            {/* === LEFT COLUMN (MAIN) === */}
            <div className="flex-1 space-y-5 min-w-0">
            
            {/* TITLE & SLUG */}
            <div className="space-y-2">
                <input required value={name} onChange={(e) => {setName(e.target.value); if(!slug && !productId) setSlug(e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''))}} type="text" className="w-full px-4 py-2 border border-[#8c8f94] rounded-sm focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none text-[16px] shadow-[0_1px_2px_rgba(0,0,0,0.07)]" placeholder="Product name" />
                {name && (
                    <div className="text-[13px] text-[#646970]">
                        <strong>Permalink:</strong> https://yoursite.com/product/
                        <input value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-transparent border border-transparent hover:border-[#8c8f94] px-1 rounded underline decoration-dotted text-[#3c434a]"/>
                    </div>
                )}
            </div>

            {/* LONG DESCRIPTION */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={12} className="w-full p-4 outline-none border-none resize-y text-[#2c3338]"></textarea>
            </div>

            {/* PRODUCT DATA BOX */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mt-6">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7]">
                    <div className="flex items-center gap-2">
                    <label className="font-semibold text-[#1d2327]">Product data</label>
                    <span className="text-[#dcdcde]"> — </span>
                    <select value={productType} onChange={(e) => setProductType(e.target.value)} className="bg-transparent border border-[#8c8f94] rounded-sm text-sm px-2 py-0.5 focus:border-[#2271b1] outline-none">
                        <option value="simple">Simple product</option>
                        <option value="variable">Variable product</option>
                    </select>
                    </div>
                    <div className="flex gap-3 text-xs">
                    <label className="flex items-center gap-1 select-none text-[#50575e]"><input type="checkbox" checked={isVirtual} onChange={(e) => setIsVirtual(e.target.checked)} /> Virtual</label>
                    <label className="flex items-center gap-1 select-none text-[#50575e]"><input type="checkbox" checked={isDownloadable} onChange={(e) => setIsDownloadable(e.target.checked)} /> Downloadable</label>
                    </div>
                </div>

                <div className="flex min-h-[400px]">
                    {/* Tabs */}
                    <ul className="w-[180px] bg-[#f0f0f1] border-r border-[#c3c4c7] pt-2 flex-shrink-0">
                    {['general', 'inventory', 'shipping', 'linked_products', 'attributes', 'variations', 'advanced'].map((tab) => (
                        (tab === 'variations' && productType !== 'variable') ? null :
                        (tab === 'shipping' && isVirtual) ? null :
                        <li key={tab} onClick={() => setActiveTab(tab)} className={`cursor-pointer px-4 py-2.5 text-[13px] border-b border-[#dcdcde] flex items-center justify-between relative hover:bg-[#f6f7f7] hover:text-[#1d2327] ${activeTab === tab ? "bg-white text-[#1d2327] font-semibold border-r-white -mr-[1px] border-b-[#c3c4c7]" : "text-[#2271b1]"}`}>
                            <span className="capitalize">{tab.replace('_', ' ')}</span>
                        </li>
                    ))}
                    </ul>

                    {/* Content */}
                    <div className="flex-1 p-4 bg-white relative">
                    
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-3 max-w-lg">
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Regular price ($)</label><input type="number" required value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" /></div>
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Sale price ($)</label><input type="number" value={salePrice} onChange={(e) => setSalePrice(parseFloat(e.target.value))} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" /></div>
                            <div className="border-t border-[#f0f0f1] pt-3 mt-3 grid grid-cols-3 items-center gap-4"><label className="text-right font-medium text-gray-500">Cost per item</label><div className="col-span-2"><input type="number" value={cost} onChange={(e) => setCost(parseFloat(e.target.value))} className="border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" placeholder="0.00" /><p className="text-[11px] text-[#646970] mt-1">Customers won't see this</p></div></div>
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Tax status</label><select value={taxStatus} onChange={(e) => setTaxStatus(e.target.value)} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full bg-white focus:border-[#2271b1] outline-none shadow-sm"><option value="taxable">Taxable</option><option value="shipping">Shipping only</option><option value="none">None</option></select></div>
                        </div>
                    )}

                    {/* INVENTORY TAB */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-3 max-w-lg">
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">SKU</label><input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" /></div>
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Barcode</label><input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" /></div>
                            <div className="grid grid-cols-3 items-center gap-4"><div className="col-start-2 col-span-2"><label className="flex items-center gap-2 select-none"><input type="checkbox" checked={trackQuantity} onChange={(e) => setTrackQuantity(e.target.checked)} /> Track stock quantity</label></div></div>
                            {trackQuantity && (<div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Quantity</label><input type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value))} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" /></div>)}
                        </div>
                    )}

                    {/* SHIPPING TAB */}
                    {activeTab === 'shipping' && !isVirtual && (
                        <div className="space-y-3 max-w-lg">
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" placeholder="0" /></div>
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Dimensions (cm)</label><div className="col-span-2 flex gap-2"><input type="number" placeholder="L" value={length} onChange={(e) => setLength(e.target.value)} className="w-1/3 border border-[#8c8f94] p-1.5 rounded-sm" /><input type="number" placeholder="W" value={width} onChange={(e) => setWidth(e.target.value)} className="w-1/3 border border-[#8c8f94] p-1.5 rounded-sm" /><input type="number" placeholder="H" value={height} onChange={(e) => setHeight(e.target.value)} className="w-1/3 border border-[#8c8f94] p-1.5 rounded-sm" /></div></div>
                        </div>
                    )}

                    {/* ATTRIBUTES TAB (Dynamic Sync) */}
                    {activeTab === 'attributes' && (
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b border-[#f0f0f1] pb-3">
                                <div className="flex gap-2">
                                    <select className="border border-[#8c8f94] p-1 rounded-sm text-sm"><option>Custom product attribute</option></select>
                                    <button type="button" onClick={addAttribute} className="bg-[#f6f7f7] border border-[#c3c4c7] px-3 py-1.5 rounded-sm hover:bg-[#f0f0f1] text-[#2271b1] font-medium text-sm">Add</button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {/* Datalist for Global Attribute Suggestion */}
                                <datalist id="global-attributes">
                                    {globalAttributes.map(attr => (
                                        <option key={attr.id} value={attr.name} />
                                    ))}
                                </datalist>

                                {attributes.map((attr, idx) => (
                                    <div key={attr.id} className="border border-[#c3c4c7] bg-[#f6f7f7] p-3 rounded-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-sm">Attribute #{idx + 1}</span>
                                        <button type="button" onClick={() => setAttributes(attributes.filter(a => a.id !== attr.id))} className="text-[#a00] hover:underline text-xs">Remove</button>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-4">
                                            <label className="block text-xs font-bold mb-1">Name</label>
                                            {/* ✅ Dynamic List Input */}
                                            <input 
                                                list="global-attributes"
                                                value={attr.name} 
                                                onChange={(e) => {const n=[...attributes]; n[idx].name=e.target.value; setAttributes(n)}} 
                                                className="w-full border border-[#8c8f94] p-1.5 rounded-sm focus:border-[#2271b1] outline-none" 
                                                placeholder="e.g. Color or Size" 
                                            />
                                        </div>
                                        <div className="col-span-8">
                                            <label className="block text-xs font-bold mb-1">Value(s)</label>
                                            <div className="bg-white border border-[#8c8f94] p-1.5 rounded-sm min-h-[34px] flex flex-wrap gap-1">
                                                {attr.values.map((val, vIdx) => (
                                                    <span key={vIdx} className="bg-[#f0f0f1] border border-[#c3c4c7] px-1.5 rounded text-xs flex items-center gap-1">
                                                        {val} <button type="button" onClick={()=>{const n=[...attributes]; n[idx].values = n[idx].values.filter((_, i) => i !== vIdx); setAttributes(n)}}><X size={10}/></button>
                                                    </span>
                                                ))}
                                                <input type="text" className="flex-1 outline-none text-sm min-w-[60px]" placeholder={attr.values.length === 0 ? "Enter & press Enter" : ""} onKeyDown={(e) => {if(e.key === 'Enter' && e.currentTarget.value.trim()){e.preventDefault(); const n=[...attributes]; n[idx].values = [...n[idx].values, e.currentTarget.value.trim()]; setAttributes(n); e.currentTarget.value = '';}}} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex gap-4 text-xs">
                                        <label><input type="checkbox" checked={attr.visible} onChange={() => {const n=[...attributes]; n[idx].visible=!n[idx].visible; setAttributes(n)}} /> Visible on the product page</label>
                                        <label><input type="checkbox" checked={attr.variation} onChange={() => {const n=[...attributes]; n[idx].variation=!n[idx].variation; setAttributes(n)}} /> Used for variations</label>
                                    </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VARIATIONS TAB */}
                    {activeTab === 'variations' && (
                        <div className="space-y-4">
                            <div className="flex gap-2 mb-4 p-3 bg-white border-l-4 border-[#2271b1] text-xs shadow-sm">
                                <p>Make sure you have added attributes and a regular price before generating variations.</p>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex gap-2">
                                    <button type="button" onClick={generateVariations} className="bg-[#f6f7f7] border border-[#c3c4c7] px-3 py-1.5 rounded-sm hover:bg-[#f0f0f1] text-[#2271b1] font-medium text-sm">Generate Variations</button>
                                </div>
                            </div>
                            {variations.length > 0 && (
                                <div className="border border-[#c3c4c7] rounded-sm divide-y divide-[#c3c4c7]">
                                {variations.map((v, i) => (
                                    <div key={v.id} className="bg-white">
                                        <div className="p-3 bg-[#f0f0f1] flex justify-between items-center cursor-pointer">
                                            <h4 className="font-bold text-sm">#{v.id} - {v.name}</h4>
                                            <button type="button" onClick={() => setVariations(variations.filter(varItem => varItem.id !== v.id))} className="text-[#a00] hover:underline text-xs">Remove</button>
                                        </div>
                                        <div className="p-4 grid grid-cols-3 gap-4 bg-white">
                                            <div><label className="text-xs font-bold block mb-1">SKU</label><input type="text" value={v.sku} onChange={(e)=>{const n=[...variations]; n[i].sku=e.target.value; setVariations(n)}} className="w-full border border-[#8c8f94] p-1.5 rounded-sm" /></div>
                                            <div><label className="text-xs font-bold block mb-1">Regular Price ($)</label><input type="number" value={v.price} onChange={(e)=>{const n=[...variations]; n[i].price=parseFloat(e.target.value); setVariations(n)}} className="w-full border border-[#8c8f94] p-1.5 rounded-sm" /></div>
                                            <div><label className="text-xs font-bold block mb-1">Stock status</label><input type="number" placeholder="Stock Qty" value={v.stock} onChange={(e)=>{const n=[...variations]; n[i].stock=parseInt(e.target.value); setVariations(n)}} className="w-full border border-[#8c8f94] p-1.5 rounded-sm" /></div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADVANCED TAB */}
                    {activeTab === 'advanced' && (
                        <div className="space-y-3 max-w-lg">
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Purchase note</label><textarea value={purchaseNote} onChange={(e) => setPurchaseNote(e.target.value)} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" rows={2} /></div>
                            <div className="grid grid-cols-3 items-center gap-4"><label className="text-right font-medium">Menu order</label><input type="number" value={menuOrder} onChange={(e) => setMenuOrder(parseInt(e.target.value))} className="col-span-2 border border-[#8c8f94] p-1.5 rounded-sm w-full focus:border-[#2271b1] outline-none shadow-sm" /></div>
                            <div className="grid grid-cols-3 items-center gap-4"><div className="col-start-2 col-span-2"><label className="flex items-center gap-2 select-none"><input type="checkbox" checked={enableReviews} onChange={(e) => setEnableReviews(e.target.checked)} /> Enable reviews</label></div></div>
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* SHORT DESC */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mt-5">
                <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#1d2327]">Product short description</div>
                <div className="p-4">
                    <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={5} className="w-full border border-[#8c8f94] p-2 rounded-sm focus:border-[#2271b1] outline-none" />
                </div>
            </div>
            </div>

            {/* === RIGHT SIDEBAR === */}
            <div className="w-full lg:w-[280px] space-y-5 flex-shrink-0">
            {/* PUBLISH */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold flex justify-between cursor-pointer text-[#1d2327]" onClick={() => toggleBox('publish')}><span>Publish</span>{openBoxes.publish ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</div>
                {openBoxes.publish && (
                    <div className="p-3 text-[13px] space-y-3">
                        <div className="space-y-2 py-2">
                            <div className="flex items-center gap-2"><Info size={14} className="text-gray-400"/> <span>Status: <strong>{status}</strong></span> <select value={status} onChange={(e)=>setStatus(e.target.value)} className="ml-auto text-xs border p-0.5 rounded"><option value="active">Active</option><option value="draft">Draft</option></select></div>
                            <div className="flex items-center gap-2"><Info size={14} className="text-gray-400"/> <span>Visibility: <strong>{visibility}</strong></span> <select value={visibility} onChange={(e)=>setVisibility(e.target.value)} className="ml-auto text-xs border p-0.5 rounded"><option value="visible">Public</option><option value="hidden">Hidden</option></select></div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-[#f0f0f1]">
                            <a className="text-[#a00] underline hover:text-red-700 cursor-pointer text-xs">Move to Trash</a>
                            <button disabled={loading} type="submit" className="px-4 py-1.5 bg-[#2271b1] text-white font-bold rounded shadow-sm hover:bg-[#135e96] border border-[#2271b1] transition text-sm">{loading ? "Saving..." : (productId ? "Update" : "Publish")}</button>
                        </div>
                    </div>
                )}
            </div>

            {/* CATEGORIES */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#1d2327]" onClick={() => toggleBox('category')}>
                    <div className="flex justify-between items-center">
                       <span>Product categories</span>
                       {openBoxes.category ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>
                </div>
                {openBoxes.category && (
                    <div className="p-3">
                        <div className="max-h-[200px] overflow-y-auto border border-[#dcdcde] p-2 bg-[#fdfdfd] mb-2 rounded-sm">
                            {dbCategories.length > 0 ? (
                                dbCategories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-2 mb-1 select-none">
                                        <input 
                                            type="radio" 
                                            checked={category === cat.name} 
                                            onChange={() => setCategory(cat.name)} 
                                        />
                                        <span className="text-[13px]">{cat.name}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 p-2">No categories found.</p>
                            )}
                        </div>
                        {!isAddingCategory ? (
                            <a className="text-[#2271b1] underline text-xs cursor-pointer" onClick={() => setIsAddingCategory(true)}>+ Add new category</a>
                        ) : (
                            <div className="mt-2 space-y-2">
                                <input value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} className="w-full border border-[#8c8f94] p-1 rounded-sm focus:border-[#2271b1] outline-none" placeholder="New category name" />
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleAddCategory} className="bg-[#f6f7f7] border border-[#c3c4c7] px-3 py-1 rounded text-xs hover:bg-[#f0f0f1] text-[#2271b1]">Add</button>
                                    <button type="button" onClick={() => setIsAddingCategory(false)} className="text-xs text-red-500">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TAGS */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#1d2327]">Product tags</div>
                <div className="p-3">
                    <div className="flex gap-2 mb-2">
                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => {if(e.key==='Enter'){e.preventDefault(); if(tagInput.trim()){setTags([...tags, tagInput.trim()]); setTagInput('')}}}} className="flex-1 border border-[#8c8f94] rounded-sm px-2 py-1 text-sm focus:border-[#2271b1] outline-none" />
                        <button type="button" onClick={() => {if(tagInput){setTags([...tags, tagInput]); setTagInput('')}}} className="bg-[#f6f7f7] border border-[#c3c4c7] px-3 py-1 rounded text-sm hover:bg-[#f0f0f1] text-[#2271b1]">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-xs text-[#3c434a]"><X size={10} className="cursor-pointer bg-[#c3c4c7] rounded-full text-white hover:bg-red-500" onClick={() => setTags(tags.filter(t => t !== tag))} /> {tag}</span>
                        ))}
                    </div>
                    <p className="text-xs text-[#2271b1] underline mt-2 cursor-pointer">Choose from the most used tags</p>
                </div>
            </div>

            {/* PRODUCT IMAGE (FIXED) */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#1d2327]">Product image</div>
                <div className="p-3">
                    <ImageUpload 
                        value={featuredImage} 
                        disabled={loading} 
                        onChange={(url) => setFeaturedImage([url])} 
                        onRemove={() => setFeaturedImage([])} 
                    />
                    <p className="text-xs text-[#2271b1] underline mt-2 text-center cursor-pointer">Set product image</p>
                </div>
            </div>

            {/* PRODUCT GALLERY (FIXED: Grid Style Added) */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#1d2327]">Product gallery</div>
                <div className="p-3">
                    {/* ✅ FIX: Gallery Image Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        {galleryImages.map((img, i) => (
                            <div key={i} className="relative aspect-square group border border-[#dcdcde] rounded-sm overflow-hidden">
                                <img src={img} className="w-full h-full object-cover" />
                                <button 
                                    type="button" 
                                    onClick={() => setGalleryImages(galleryImages.filter(c => c !== img))} 
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-2">
                        <ImageUpload 
                            value={[]} 
                            disabled={loading} 
                            onChange={(url) => setGalleryImages([...galleryImages, url])} 
                            onRemove={() => {}} 
                        />
                        <p className="text-[#2271b1] underline cursor-pointer text-xs mt-2">Add product gallery images</p>
                    </div>
                </div>
            </div>
            
            {/* VENDOR */}
            <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f6f7f7] font-semibold text-[#1d2327]">Organization</div>
                <div className="p-3 space-y-2">
                    <label className="block text-xs font-bold">Vendor</label>
                    <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full border border-[#8c8f94] p-1.5 rounded-sm focus:border-[#2271b1] outline-none" placeholder="e.g. Nike" />
                </div>
            </div>

            </div>
        </div>
      </form>
    </div>
  );
}