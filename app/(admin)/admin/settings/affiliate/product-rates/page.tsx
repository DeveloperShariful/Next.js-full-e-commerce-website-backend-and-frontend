//File: app/(admin)/admin/settings/affiliate/product-rates/page.tsx

import { productRateService } from "@/app/actions/admin/settings/affiliates/_services/product-rate-service";
import ProductRateManager from "./_components/product-rate-manager";
import { Package } from "lucide-react";

export const metadata = {
  title: "Product Rates | Admin",
};

export default async function ProductRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const { rates } = await productRateService.getAllRates(page, 50, search);

  const formattedRates = rates.map(r => ({
    ...r,
    rate: r.rate, 
    product: {
      ...r.product,
      price: r.product.price.toNumber()
    }
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Product Specific Rates
          </h2>
          <p className="text-sm text-gray-500">
            Override global commission rates for specific products, affiliates, or groups.
          </p>
        </div>
      </div>
      
      <div className="h-px bg-gray-200" />

      <ProductRateManager initialRates={formattedRates as any} />
    </div>
  );
}