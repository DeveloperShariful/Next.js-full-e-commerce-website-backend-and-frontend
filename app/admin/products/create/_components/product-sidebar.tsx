"use client";
import ImageUpload from "@/components/ui/image-upload";
import { Calendar, Trash2, X } from "lucide-react";

export const ProductSidebar = ({
  status, setStatus, visibility, setVisibility, publishDate, setPublishDate,
  category, setCategory, categories, newCatName, setNewCatName, isAddingCategory, setIsAddingCategory, handleAddCategory,
  featuredImage, setFeaturedImage, galleryImages, setGalleryImages,
  tags, setTags, tagInput, setTagInput, vendor, setVendor, loading, productId, handleSubmit
}: any) => {
  return (
    <div className="space-y-6">
      {/* Publish */}
      <div className="bg-white border border-gray-300 rounded shadow-sm">
        <h3 className="font-bold px-4 py-3 border-b border-gray-200 bg-[#f6f7f7] text-gray-800">Publish</h3>
        <div className="p-4 space-y-3 text-gray-700 text-sm">
          <div className="flex justify-between"><span>Status:</span> <strong>{status}</strong></div>
          <div className="flex justify-between"><span>Visibility:</span> <strong>{visibility}</strong></div>
        </div>
        <div className="bg-[#f6f7f7] border-t border-gray-200 px-4 py-3 flex justify-between items-center">
          <a className="text-[#a00] hover:underline cursor-pointer">Move to Trash</a>
          <button disabled={loading} onClick={handleSubmit} className="bg-[#2271b1] text-white px-4 py-1.5 rounded font-bold hover:bg-[#135e96] transition disabled:opacity-50">
            {productId ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border border-gray-300 rounded shadow-sm">
        <h3 className="font-bold px-4 py-3 border-b border-gray-200 bg-[#f6f7f7] text-gray-800">Categories</h3>
        <div className="p-4">
          <div className="max-h-40 overflow-y-auto border border-gray-300 p-2 mb-3 bg-[#fdfdfd]">
            {categories.map((cat: string) => (
              <label key={cat} className="flex items-center gap-2 mb-1 cursor-pointer text-sm text-gray-700">
                <input type="radio" checked={category === cat} onChange={() => setCategory(cat)} /> {cat}
              </label>
            ))}
          </div>
          {!isAddingCategory ? (
            <a className="text-[#2271b1] underline cursor-pointer text-sm" onClick={() => setIsAddingCategory(true)}>+ Add new category</a>
          ) : (
            <div className="mt-2">
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 mb-2 text-sm focus:border-[#2271b1] outline-none" placeholder="New category name" />
              <button type="button" onClick={handleAddCategory} className="bg-[#f0f0f1] border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-200 text-gray-700">Add New Category</button>
            </div>
          )}
        </div>
      </div>

      {/* Featured Image */}
      <div className="bg-white border border-gray-300 rounded shadow-sm">
        <h3 className="font-bold px-4 py-3 border-b border-gray-200 bg-[#f6f7f7] text-gray-800">Product Image</h3>
        <div className="p-4">
          {featuredImage.length > 0 ? (
            <div className="relative group">
              <img src={featuredImage[0]} className="w-full rounded border border-gray-200" alt="Featured" />
              <button type="button" onClick={() => setFeaturedImage([])} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100"><X size={12}/></button>
            </div>
          ) : (
            <ImageUpload value={featuredImage} disabled={loading} onChange={(url) => setFeaturedImage([url])} onRemove={() => setFeaturedImage([])} />
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="bg-white border border-gray-300 rounded shadow-sm">
        <h3 className="font-bold px-4 py-3 border-b border-gray-200 bg-[#f6f7f7] text-gray-800">Product Gallery</h3>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {galleryImages.map((url: string, i: number) => (
              <div key={i} className="relative aspect-square border border-gray-200 rounded overflow-hidden group">
                <img src={url} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setGalleryImages(galleryImages.filter((u: string) => u !== url))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100"><X size={10}/></button>
              </div>
            ))}
          </div>
          <ImageUpload value={[]} disabled={loading} onChange={(url) => setGalleryImages((prev: string[]) => [...prev, url])} onRemove={() => {}} />
        </div>
      </div>
      
      {/* Tags */}
      <div className="bg-white border border-gray-300 rounded shadow-sm">
        <h3 className="font-bold px-4 py-3 border-b border-gray-200 bg-[#f6f7f7] text-gray-800">Product tags</h3>
        <div className="p-4">
          <div className="flex gap-2 mb-2">
             <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:border-[#2271b1] outline-none" />
             <button type="button" onClick={() => {if(tagInput){setTags([...tags, tagInput]); setTagInput('')}}} className="bg-[#f0f0f1] border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-200 text-gray-700">Add</button>
          </div>
          <div className="flex flex-wrap gap-1">
             {tags.map((tag: string) => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-[#f0f0f1] border border-gray-300 px-2 py-1 rounded text-gray-600">
                   <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => setTags(tags.filter((t: string) => t !== tag))} /> {tag}
                </span>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};