// app/admin/orders/[orderId]/page.tsx

import { 
  getOrderDetails, 
  updateOrderStatus, 
  addOrderNote 
} from "@/app/actions/order";
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, Mail, Phone, MapPin, 
  Printer, CreditCard, User, Save // ✅ Save icon added here
} from 'lucide-react';
import { notFound } from 'next/navigation';

interface OrderDetailsProps {
  params: Promise<{ orderId: string }>;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency', currency: 'BDT'
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(date));
};

export default async function OrderDetailsPage(props: OrderDetailsProps) {
  const params = await props.params;
  const orderId = params.orderId;
  const { data: order } = await getOrderDetails(orderId);

  if (!order) return notFound();

  // Parse JSON Addresses safely
  const shipping = order.shippingAddress as any || {};
  const billing = order.billingAddress as any || {};

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              Order #{order.orderNumber} 
              <span className={`text-xs px-2 py-1 rounded uppercase tracking-wide border ${
                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800 border-green-200' :
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800 border-red-200' :
                'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                {order.status}
              </span>
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              <Calendar size={14}/> {formatDate(order.createdAt)} • IP: 192.168.1.1
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition text-slate-700 shadow-sm">
             <Printer size={16}/> Print Invoice
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition text-slate-700 shadow-sm">
             Refund
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* === LEFT COLUMN (Order Items) === */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center bg-gray-50">
               <h3>Order Items</h3>
               <span className="text-xs text-slate-500">{order.items.length} Items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-white border-b border-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Item</th>
                    <th className="p-4 text-center">Cost</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="font-medium text-blue-600">{item.productName || "Unknown Product"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">SKU: {item.sku || "N/A"}</div>
                      </td>
                      <td className="p-4 text-center">{formatPrice(Number(item.price))}</td>
                      <td className="p-4 text-center">× {item.quantity}</td>
                      <td className="p-4 text-right font-medium">{formatPrice(Number(item.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Calculation Summary */}
            <div className="p-6 bg-gray-50 border-t border-slate-200">
               <div className="flex justify-end">
                  <div className="w-full sm:w-1/2 space-y-2 text-sm">
                     <div className="flex justify-between text-slate-600">
                        <span>Items Subtotal:</span>
                        <span>{formatPrice(Number(order.subtotal))}</span>
                     </div>
                     <div className="flex justify-between text-slate-600">
                        <span>Shipping:</span>
                        <span>{formatPrice(Number(order.shippingTotal))}</span>
                     </div>
                     <div className="flex justify-between text-slate-600">
                        <span>Tax:</span>
                        <span>{formatPrice(Number(order.taxTotal))}</span>
                     </div>
                     <div className="flex justify-between text-slate-600">
                        <span>Discount:</span>
                        <span className="text-red-500">-{formatPrice(Number(order.discountTotal))}</span>
                     </div>
                     <div className="border-t border-slate-300 my-2 pt-2 flex justify-between text-lg font-bold text-slate-800">
                        <span>Order Total:</span>
                        <span>{formatPrice(Number(order.total))}</span>
                     </div>
                     <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Paid via {order.paymentMethod || "N/A"}</span>
                        <span className={order.paymentStatus === 'PAID' ? 'text-green-600 font-bold' : 'text-orange-500'}>
                           {order.paymentStatus}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Timeline / Notes */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-200 font-bold text-slate-800 bg-gray-50">
               Order Notes & Timeline
             </div>
             <div className="p-6 space-y-6">
                
                {/* Add Note Form */}
                <form 
                  action={async (formData) => {
                    'use server';
                    await addOrderNote(formData);
                  }} 
                  className="flex gap-3 items-start"
                >
                   <input type="hidden" name="orderId" value={order.id} />
                   <div className="flex-1">
                      <textarea 
                        name="content" 
                        required
                        className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Add a private note..."
                        rows={2}
                      ></textarea>
                      <div className="mt-2 flex items-center gap-2">
                         <input type="checkbox" name="notify" id="notify" className="rounded"/>
                         <label htmlFor="notify" className="text-xs text-slate-600 select-none">Notify customer via email</label>
                      </div>
                   </div>
                   <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition">Add</button>
                </form>

                {/* Notes List */}
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pl-6 pb-2">
                   {order.orderNotes.length === 0 && (
                      <p className="text-sm text-slate-400 italic">No notes added yet.</p>
                   )}
                   {order.orderNotes.map((note) => (
                      <div key={note.id} className="relative">
                         <div className={`absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-white ${note.isSystem ? 'bg-slate-400' : 'bg-blue-500'}`}></div>
                         <div className="text-sm text-slate-800">
                            {note.content}
                            {note.notify && <span className="text-[10px] text-orange-600 bg-orange-100 px-1 rounded ml-2">Customer Notified</span>}
                         </div>
                         <div className="text-xs text-slate-400 mt-1">{formatDate(note.createdAt)} {note.isSystem ? 'by System' : ''}</div>
                      </div>
                   ))}
                   
                   {/* Creation Log */}
                   <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
                      <div className="text-sm text-slate-800">Order placed successfully.</div>
                      <div className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* === RIGHT COLUMN (Customer & Actions) === */}
        <div className="space-y-6">
           
           {/* Actions Card */}
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Actions</h3>
              <form 
                action={async (formData) => {
                  'use server';
                  await updateOrderStatus(formData);
                }} 
                className="space-y-3"
              >
                 <input type="hidden" name="orderId" value={order.id} />
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Change Status</label>
                    <select name="status" defaultValue={order.status} className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500">
                       <option value="PENDING">Pending</option>
                       <option value="PROCESSING">Processing</option>
                       <option value="PACKED">Packed</option>
                       <option value="SHIPPED">Shipped</option>
                       <option value="DELIVERED">Delivered</option>
                       <option value="CANCELLED">Cancelled</option>
                       <option value="REFUNDED">Refunded</option>
                    </select>
                 </div>
                 <button className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm">
                    <Save size={16} /> Update Order
                 </button>
              </form>
           </div>

           {/* Customer Card */}
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Customer</h3>
                 <User size={16} className="text-slate-400"/>
              </div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                    {order.user?.name ? order.user.name.charAt(0) : "G"}
                 </div>
                 <div>
                    <div className="font-bold text-blue-600 hover:underline cursor-pointer text-sm">
                       {order.user?.name || "Guest Customer"}
                    </div>
                    <div className="text-xs text-slate-500">Previous orders: 0</div>
                 </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600 border-t pt-3">
                 <div className="flex items-center gap-2 break-all">
                    <Mail size={14} className="flex-shrink-0"/> {order.user?.email || order.guestEmail}
                 </div>
                 <div className="flex items-center gap-2">
                    <Phone size={14}/> {order.user?.phone || shipping.phone || "N/A"}
                 </div>
              </div>
           </div>

           {/* Shipping Address */}
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Shipping Address</h3>
                 <MapPin size={16} className="text-slate-400"/>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed">
                 <p className="font-semibold text-slate-800">{shipping.firstName} {shipping.lastName}</p>
                 <p>{shipping.address1}</p>
                 <p>{shipping.city}, {shipping.state} {shipping.postcode}</p>
                 <p>{shipping.country}</p>
                 <p className="mt-2 text-xs text-slate-400">Via {order.shippingMethod || "Standard Delivery"}</p>
              </div>
           </div>

           {/* Billing Address */}
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Billing Address</h3>
                 <CreditCard size={16} className="text-slate-400"/>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed">
                 <p className="font-semibold text-slate-800">{billing.firstName} {billing.lastName}</p>
                 <p>{billing.address1}</p>
                 <p>{billing.city}, {billing.state} {billing.postcode}</p>
                 <p>{billing.country}</p>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}