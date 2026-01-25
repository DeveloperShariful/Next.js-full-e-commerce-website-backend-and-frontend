//app/(storefront)/affiliates/marketing/creatives/page.tsx

import { marketingService } from "@/app/actions/storefront/affiliates/_services/marketing-service";
import CopyButton from "../../_components/copy-button";
import { ImageIcon, Download, ExternalLink } from "lucide-react";
// ✅ আপডেট করা ইম্পোর্ট পাথ
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Banners & Creatives | Marketing Tools",
};

export default async function CreativesPage() {
  // ✅ শুধু অথেন্টিকেশন চেক করার জন্য কল করা হলো
  await requireUser();

  const creatives = await marketingService.getCreatives();

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-pink-600" />
          Marketing Assets
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Download high-quality banners and images to promote our products.
        </p>
      </div>

      {/* Gallery Grid */}
      {creatives.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed rounded-xl">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No assets available</h3>
          <p className="text-sm text-gray-500">Check back later for new promotional materials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {creatives.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              
              {/* Preview */}
              <div className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden p-4">
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <div className="text-center p-6">
                    <ExternalLink className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-600">External Resource</p>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    download 
                    className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-5 flex flex-col flex-1">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1" title={item.title}>
                    {item.title}
                  </h3>
                  {item.width && item.height && (
                    <p className="text-xs text-gray-500 mt-1">
                      Size: {item.width} x {item.height}px
                    </p>
                  )}
                </div>

                <div className="mt-auto space-y-3">
                  {/* Direct Link Copy */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Image URL</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                      <code className="text-xs text-gray-600 truncate flex-1">{item.url}</code>
                      <CopyButton text={item.url} variant="ghost" className="h-6 w-6 p-1" />
                    </div>
                  </div>

                  {/* HTML Embed Code */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Embed Code</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                      <code className="text-xs text-gray-600 truncate flex-1">
                        {`<a href="..."><img src="${item.url}" alt="${item.title}"/></a>`}
                      </code>
                      <CopyButton 
                        text={`<a href="YOUR_AFFILIATE_LINK"><img src="${item.url}" alt="${item.title}"/></a>`} 
                        variant="ghost" 
                        className="h-6 w-6 p-1" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}