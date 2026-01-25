//app/(storefront)/affiliates/(dashboard)/reports/conversions/page.tsx

import { db } from "@/lib/prisma";
import { DollarSign, ShoppingBag, User } from "lucide-react";
import { format } from "date-fns";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Conversion Report | Analytics",
};

export default async function ConversionsPage() {
  const userId = await requireUser();
  const affiliate = await db.affiliateAccount.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!affiliate) return null;

  // Fetch conversions with safer selection
  const conversions = await db.referral.findMany({
    where: { 
      affiliateId: affiliate.id,
    },
    include: {
      order: {
        select: { 
          id: true,
          orderNumber: true, 
          total: true, 
          // user: { select: { name: true } } // Removing relations to be safe
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Conversion Report
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track every sale generated through your referral links.
        </p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Commission</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conversions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500">
                    <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p>No conversions yet. Share your links to start earning!</p>
                  </td>
                </tr>
              ) : (
                conversions.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {/* Safe Check for Order */}
                      {item.order ? (
                        <>
                          <div className="font-medium text-gray-900">#{item.order.orderNumber}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" /> Customer
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Deleted Order</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">
                        {/* Safe check for total */}
                        ${item.order?.total ? Number(item.order.total).toFixed(2) : "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-xs">
                        +${Number(item.commissionAmount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        item.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}