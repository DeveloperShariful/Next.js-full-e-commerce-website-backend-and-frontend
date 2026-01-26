//app/(admin)/admin/settings/affiliate/domains/page.tsx

import { domainService } from "@/app/actions/admin/settings/affiliates/_services/domain-service";
import DomainList from "./_components/domain-list";
import { Globe, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Custom Domains | Affiliate Admin",
};

export default async function CustomDomainsPage() {
  const domains = await domainService.getAllDomains();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-cyan-600" />
            Custom Domains
          </h2>
          <p className="text-sm text-gray-500">
            Allow affiliates to use their own branded domains (White Label).
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs rounded-lg border border-green-100">
          <ShieldCheck className="w-4 h-4" />
          SSL Certificates are auto-provisioned.
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <DomainList initialDomains={domains} />
    </div>
  );
}