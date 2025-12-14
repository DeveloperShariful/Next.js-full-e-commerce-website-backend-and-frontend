//app/products/page.tsx

import { db } from "@/lib/db";
import { Overview } from "../admin/overview"; 
import { 
  DollarSign, ShoppingBag, Package, Users
} from "lucide-react";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(price);
};

export default async function AdminDashboardPage() {
  
  // ১. পেইড অর্ডার আনা (FIXED: paymentStatus & items)
  const paidOrders = await db.order.findMany({
    where: { 
      paymentStatus: 'PAID' // isPaid -> paymentStatus
    },
    include: {
      items: { // orderItems -> items
        // include product is not needed here as price is in item
      }
    }
  });

  // ২. রেভিনিউ ক্যালকুলেশন
  const totalRevenue = paidOrders.reduce((total: number, order: any) => {
    // items এর মধ্যেই price আছে, তাই product রিলেশন না আনলেও চলবে
    const orderTotal = order.items.reduce((orderSum: number, item: any) => {
      return orderSum + (item.price * item.quantity);
    }, 0);
    return total + orderTotal;
  }, 0);

  // ৩. অন্যান্য কাউন্ট
  const totalOrders = await db.order.count();
  const productsCount = await db.product.count();
  const categoriesCount = await db.category.count();
  
  // ৪. লো স্টক প্রোডাক্ট (FIXED: Inventory Logic simplified)
  // যেহেতু নতুন স্কিমায় stock সরাসরি নেই, তাই আমরা আপাতত trackQuantity চেক করছি
  // অথবা inventoryLevels রিলেশন চেক করতে হবে। সহজ করার জন্য আমরা এখানে সিম্পল কুয়েরি রাখছি।
  const lowStockProducts = await db.product.findMany({
    where: { 
      status: 'active',
      trackQuantity: true
      // stock ফিল্ড নেই তাই এই কন্ডিশন বাদ বা অন্য লজিক লাগবে
    },
    take: 5,
    select: { name: true } // stock ফিল্ড নেই
  });

  // ৫. গ্রাফ ডাটা
  const graphData = [
    { name: "Jan", total: 0 }, { name: "Feb", total: 0 }, { name: "Mar", total: 0 },
    { name: "Apr", total: 0 }, { name: "May", total: 0 }, { name: "Jun", total: 0 },
    { name: "Jul", total: 0 }, { name: "Aug", total: 0 }, { name: "Sep", total: 0 },
    { name: "Oct", total: 0 }, { name: "Nov", total: 0 }, { name: "Dec", total: 0 },
  ];

  for (const order of paidOrders) {
    const month = order.createdAt.getMonth(); // 0 = Jan
    let orderRevenue = 0;
    for (const item of order.items) {
      orderRevenue += (item.price * item.quantity);
    }
    graphData[month].total += orderRevenue;
  }

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time overview of your store.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-slate-500 uppercase">Total Revenue</h3>
             <div className="p-2 bg-green-100 text-green-600 rounded-full"><DollarSign size={20} /></div>
          </div>
          <div>
             <h2 className="text-3xl font-bold text-slate-800">{formatPrice(totalRevenue)}</h2>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-slate-500 uppercase">Total Orders</h3>
             <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><ShoppingBag size={20} /></div>
          </div>
          <div>
             <h2 className="text-3xl font-bold text-slate-800">{totalOrders}</h2>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-slate-500 uppercase">Products</h3>
             <div className="p-2 bg-purple-100 text-purple-600 rounded-full"><Package size={20} /></div>
          </div>
          <div>
             <h2 className="text-3xl font-bold text-slate-800">{productsCount}</h2>
             <p className="text-sm text-slate-500 mt-1">in {categoriesCount} categories</p>
          </div>
        </div>

        {/* Dynamic Graph Placeholder */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-semibold text-slate-500 uppercase">Status</h3>
             <div className="p-2 bg-orange-100 text-orange-600 rounded-full"><Users size={20} /></div>
          </div>
          <div>
             <h2 className="text-lg font-bold text-slate-800">Active</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800">Revenue (This Year)</h3>
           </div>
           <Overview data={graphData} />
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Inventory Alert</h3>
              {lowStockProducts.length === 0 ? (
                 <p className="text-sm text-green-600">Checking inventory...</p>
              ) : (
                 <div className="space-y-3">
                    {lowStockProducts.map((p: any, i: number) => (
                       <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                          <span className="text-slate-700 font-medium">{p.name}</span>
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">Check Stock</span>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}