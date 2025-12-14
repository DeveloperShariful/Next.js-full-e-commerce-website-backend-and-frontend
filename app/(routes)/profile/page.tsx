// app/(routes)/profile/page.tsx

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { User, Mail, Phone, MapPin } from "lucide-react";

export default async function CustomerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { addresses: true } // Fetch addresses
  });

  if (!user) return <div>User not found</div>;
  const address = user.addresses[0]; // Default address

  return (
    <div className="container mx-auto px-6 py-12">
       <h1 className="text-3xl font-bold text-slate-900 mb-8">My Profile</h1>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
             <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-blue-600 mb-4 border-4 border-white shadow-md">
                {user.name?.charAt(0).toUpperCase()}
             </div>
             <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
             <p className="text-slate-500 text-sm">{user.email}</p>
             <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Phone size={14}/> {user.phone || "N/A"}</span>
             </div>
          </div>

          {/* Details & Address */}
          <div className="md:col-span-2 space-y-6">
             <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                   <User size={20} className="text-blue-600"/> Personal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                      <p className="font-medium text-slate-800 mt-1">{user.name}</p>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                      <p className="font-medium text-slate-800 mt-1">{user.email}</p>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                      <p className="font-medium text-slate-800 mt-1">{user.phone || "Not set"}</p>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Member Since</label>
                      <p className="font-medium text-slate-800 mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
             </div>

             <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                   <MapPin size={20} className="text-blue-600"/> Default Address
                </h3>
                {address ? (
                   <div className="text-sm text-slate-600 leading-relaxed">
                      <p className="font-bold text-slate-800">{address.firstName} {address.lastName}</p>
                      <p>{address.address1}</p>
                      <p>{address.city}, {address.state} - {address.postcode}</p>
                      <p>{address.country}</p>
                      <p className="mt-1 text-slate-500">{address.phone}</p>
                   </div>
                ) : (
                   <p className="text-slate-400 italic text-sm">No address saved yet. It will be saved when you place an order.</p>
                )}
             </div>
          </div>

       </div>
    </div>
  );
}