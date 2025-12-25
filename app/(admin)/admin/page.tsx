//app/admin/page.tsx

import { db } from "@/lib/db";
import { Overview } from "./_components/overview";
import { 
  DollarSign, ShoppingBag, Package, Users, 
  ArrowUpRight, AlertCircle 
} from "lucide-react";
import Link from "next/link"; 
import { OrderStatus } from "@prisma/client";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(price);
};

export default async function AdminDashboardPage() {
  
  const revenueResult = await db.order.aggregate({
    _sum: { total: true },
    where: { 
      status: { not: OrderStatus.CANCELLED } 
    }
  });
  const totalRevenue = revenueResult._sum.total || 0;

  const totalOrders = await db.order.count();
  
  const productsCount = await db.product.count({ 
    where: { status: { not: 'archived' } } 
  }); 
  
  const categoriesCount = await db.category.count();
  const customersCount = await db.user.count({ where: { role: 'CUSTOMER' } });

  const lowStockVariants = await db.productVariant.findMany({
    where: { 
      stock: { lte: 5 }, 
      product: { trackQuantity: true }
    },
    take: 5,
    include: {
      product: {
        select: { name: true, featuredImage: true }
      }
    },
    orderBy: { stock: 'asc' }
  });

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31);

  const monthlyOrders = await db.order.findMany({
    where: {
      status: { not: OrderStatus.CANCELLED },
      createdAt: { gte: startOfYear, lte: endOfYear }
    },
    select: { createdAt: true, total: true }
  });

  const graphData = [
    { name: "Jan", total: 0 }, { name: "Feb", total: 0 }, { name: "Mar", total: 0 },
    { name: "Apr", total: 0 }, { name: "May", total: 0 }, { name: "Jun", total: 0 },
    { name: "Jul", total: 0 }, { name: "Aug", total: 0 }, { name: "Sep", total: 0 },
    { name: "Oct", total: 0 }, { name: "Nov", total: 0 }, { name: "Dec", total: 0 },
  ];

  monthlyOrders.forEach(order => {
    const month = order.createdAt.getMonth();
    graphData[month].total += order.total;
  });

  return (
    <div className="p-4 font-sans text-slate-800 pb-10">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time overview of your store performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <Link href="/admin/analytics" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition duration-300">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition">Total Sales</h3>
               <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition"><DollarSign size={20} /></div>
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-800">{formatPrice(totalRevenue)}</h2>
               <p className="text-xs text-green-600 flex items-center mt-1 font-bold">
                  <ArrowUpRight size={14} className="mr-1"/> +20.1% <span className="text-slate-400 font-normal ml-1">from last month</span>
               </p>
            </div>
          </div>
        </Link>

        <Link href="/admin/orders" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition duration-300">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition">Total Orders</h3>
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition"><ShoppingBag size={20} /></div>
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-800">{totalOrders}</h2>
               <p className="text-xs text-blue-600 flex items-center mt-1 font-bold">
                  <ArrowUpRight size={14} className="mr-1"/> New <span className="text-slate-400 font-normal ml-1">this month</span>
               </p>
            </div>
          </div>
        </Link>

        <Link href="/admin/products" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition duration-300">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition">Products</h3>
               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition"><Package size={20} /></div>
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-800">{productsCount}</h2>
               <p className="text-xs text-slate-400 mt-1">Across {categoriesCount} categories</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/customers" className="block group">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition duration-300">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition">Active Customers</h3>
               <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition"><Users size={20} /></div>
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-800">{customersCount}</h2>
               <p className="text-xs text-slate-400 mt-1">Registered users</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800">Sales Overview ({currentYear})</h3>
           </div>
           <Overview data={graphData} />
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="text-red-500" size={20}/>
                  <h3 className="font-bold text-lg text-slate-800">Low Stock Alert</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {lowStockVariants.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-green-600 text-sm font-medium">
                      All stocks are healthy!
                   </div>
                ) : (
                   lowStockVariants.map((variant) => (
                      <div key={variant.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 transition hover:bg-slate-100">
                         <div className="flex flex-col min-w-0 pr-4">
                            <span className="text-sm font-bold text-slate-700 truncate">{variant.product.name}</span>
                            <span className="text-xs text-slate-500 truncate">{variant.name}</span>
                         </div>
                         <div className="flex flex-col items-end shrink-0">
                            <span className="text-sm font-bold text-red-600">{variant.stock} left</span>
                            <span className="text-[10px] text-slate-400">Stock</span>
                         </div>
                      </div>
                   ))
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                  <Link 
                    href="/admin/inventory" 
                    className="block w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded transition uppercase tracking-wide"
                  >
                      View Inventory
                  </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}