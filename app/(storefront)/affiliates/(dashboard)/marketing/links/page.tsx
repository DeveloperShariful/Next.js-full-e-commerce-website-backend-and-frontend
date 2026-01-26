//app/(storefront)/affiliates/marketing/links/page.tsx

import { marketingService } from "@/app/actions/storefront/affiliates/_services/marketing-service";
import { Link as LinkIcon, ArrowRight, BarChart2 } from "lucide-react";
import LinkGeneratorForm from "./_components/link-generator-form";
import CopyButton from "../../_components/copy-button"; 
import { db } from "@/lib/prisma";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Link Generator",
};

export default async function LinksPage() {
  const userId = await requireUser();
  
  const affiliate = await db.affiliateAccount.findUnique({ 
      where: { userId },
      select: { id: true, slug: true }
  });

  if (!affiliate) return null;

  // ১. অ্যাডমিন থেকে 'ref' নাকি 'aff' সেটা নিয়ে আসা
  const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
  const config = (settings?.affiliateConfig as any) || {};
  const paramName = config.referralParam || "ref"; // অ্যাডমিন প্যানেলে যা সেট করবেন

  const [links, campaigns] = await Promise.all([
    marketingService.getLinks(affiliate.id),
    marketingService.getCampaigns(affiliate.id)
  ]);

  // ২. বেস URL ঠিক করা (undefined ফিক্স)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  // ৩. মেইন লিংক তৈরি (আপনার চাওয়া অনুযায়ী)
  const defaultLink = `${baseUrl}/?${paramName}=${affiliate.slug}`;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LinkIcon className="w-6 h-6 text-blue-600" />
          Affiliate Links
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate numeric tracking links.
        </p>
      </div>

      {/* Default Link Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
        <h3 className="text-sm font-medium opacity-90 uppercase tracking-wider mb-2">Your Main Referral Link</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/10 p-2 rounded-lg border border-white/20 backdrop-blur-sm">
          <code className="flex-1 font-mono text-lg px-2 truncate w-full">
            {defaultLink}
          </code>
          <CopyButton text={defaultLink} className="bg-white text-blue-700 hover:bg-blue-50 border-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Generator Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border shadow-sm sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Create Short Link</h3>
            <LinkGeneratorForm userId={userId} campaigns={campaigns} />
          </div>
        </div>

        {/* Links List */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-medium text-gray-900">My Short Links</h3>
              <span className="text-xs text-gray-500">{links.length} Generated</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Short ID / Destination</th>
                    <th className="px-6 py-3 text-center">Clicks</th>
                    <th className="px-6 py-3 text-right">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {links.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        No custom links yet.
                      </td>
                    </tr>
                  ) : (
                    links.map((link) => {
                      // শর্ট লিংক ফরম্যাট
                      const shortUrl = `${baseUrl}/go/${link.slug}`;
                      
                      return (
                        <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-lg text-blue-600">{link.slug}</span>
                              {link.campaign && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border uppercase">
                                  {link.campaign.name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-[250px] flex items-center gap-1">
                              <ArrowRight className="w-3 h-3" /> {link.destinationUrl}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                              <BarChart2 className="w-3 h-3" />
                              {link.clickCount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <CopyButton text={shortUrl} variant="ghost" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}