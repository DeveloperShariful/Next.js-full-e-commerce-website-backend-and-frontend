// app/(routes)/profile/page.tsx

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { User, Mail, Phone, MapPin, Calendar, Edit2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function CustomerProfilePage() {
  // 1. Get Clerk User
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // 2. Get DB User (using email)
  const user = await db.user.findUnique({
    where: { email: clerkUser.emailAddresses[0].emailAddress },
    include: { addresses: { where: { isDefault: true }, take: 1 } } 
  });

  if (!user) {
    return <div className="p-20 text-center">Syncing profile... Please refresh.</div>;
  }

  const address = user.addresses[0]; // Default address

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
       <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          {/* Clerk Profile Edit Modal Trigger */}
          {/* In Clerk, users edit profile via UserButton, so we can guide them there or link to account portal */}
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Profile Card */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center h-fit">
             <div className="w-28 h-28 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-slate-400 mb-4 border-4 border-white shadow-md overflow-hidden relative">
                {clerkUser.imageUrl ? (
                   <Image src={clerkUser.imageUrl} alt="Profile" fill className="object-cover" />
                ) : (
                   user.name?.charAt(0).toUpperCase()
                )}
             </div>
             <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
             <p className="text-slate-500 text-sm">{user.email}</p>
             <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-center gap-2">
                   <Phone size={14} className="text-blue-600"/> {user.phone || "Add Phone"}
                </div>
                <div className="flex items-center justify-center gap-2">
                   <Calendar size={14} className="text-blue-600"/> Joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
             </div>
          </div>

          {/* Right: Details & Address */}
          <div className="lg:col-span-2 space-y-6">
             
             {/* Personal Details */}
             <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                   <User size={20} className="text-blue-600"/> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                      <p className="font-semibold text-slate-800 text-base">{user.name}</p>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                      <p className="font-semibold text-slate-800 text-base">{user.email}</p>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                      <p className="font-semibold text-slate-800 text-base">{user.phone || "Not provided"}</p>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Account ID</label>
                      <p className="font-mono text-slate-500 text-sm bg-slate-50 inline-block px-2 py-1 rounded">{user.id.slice(0, 8)}...</p>
                   </div>
                </div>
             </div>

             {/* Default Address */}
             <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                   <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                      <MapPin size={20} className="text-blue-600"/> Shipping Address
                   </h3>
                   {/* Edit Address Link (Future Implementation) */}
                   {/* <button className="text-xs font-bold text-blue-600 hover:underline">Edit</button> */}
                </div>
                
                {address ? (
                   <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-900 text-base mb-1">{address.firstName} {address.lastName}</p>
                      <p>{address.address1}</p>
                      <p>{address.city}, {address.state} {address.postcode}</p>
                      <p className="font-medium text-slate-700 mt-2">{address.country}</p>
                      <p className="mt-2 flex items-center gap-2 text-slate-500">
                         <Phone size={12}/> {address.phone}
                      </p>
                   </div>
                ) : (
                   <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <p className="text-slate-400 italic text-sm mb-2">No default address found.</p>
                      <p className="text-xs text-slate-500">Address will be saved automatically after your first order.</p>
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
}