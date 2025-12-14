// app/admin/profile/profile-form.tsx

"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { toast } from "react-hot-toast";
import ImageUpload from "@/components/ui/image-upload"; // Using your existing component
import { 
  User, Phone, Mail, Save, Loader2, Shield, 
  Calendar, Lock, Camera, MapPin, Activity 
} from "lucide-react";
import Image from "next/image";

interface ProfileFormProps {
  user: any;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Local state for image preview immediately after upload
  const [image, setImage] = useState(user.image ? [user.image] : []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // Manually append image if changed
    if(image.length > 0) formData.append("image", image[0]);

    const res = await updateProfile(formData);

    if (res.success) {
      toast.success(res.message as string);
    } else {
      toast.error(res.error as string);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
       
       {/* HEADER COVER */}
       <div className="relative h-48 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-6 left-8 flex items-end gap-6 z-10">
             <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative">
                   {image.length > 0 ? (
                      <Image src={image[0]} alt="Profile" fill className="object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-4xl">
                         {user.name?.charAt(0).toUpperCase()}
                      </div>
                   )}
                   {/* Hidden Upload Trigger Overlay */}
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                      <Camera className="text-white" />
                   </div>
                </div>
                {/* Real ImageUpload Component (Hidden but functional) */}
                <div className="absolute inset-0 opacity-0 cursor-pointer">
                   <ImageUpload 
                      value={image} 
                      onChange={(url) => setImage([url])}
                      onRemove={() => setImage([])}
                      disabled={loading}
                   />
                </div>
             </div>
             
             <div className="mb-2 text-white">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-blue-200 text-sm flex items-center gap-1.5 opacity-90">
                   <Shield size={14} className="fill-blue-200"/> {user.role?.replace('_', ' ')}
                </p>
             </div>
          </div>
       </div>

       {/* CONTENT GRID */}
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR NAVIGATION */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-2 space-y-1">
                   {["general", "security", "activity"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${
                           activeTab === tab 
                           ? "bg-slate-50 text-blue-600 border border-slate-100" 
                           : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                         {tab === "general" && <User size={18}/>}
                         {tab === "security" && <Lock size={18}/>}
                         {tab === "activity" && <Activity size={18}/>}
                         <span className="capitalize">{tab} Settings</span>
                      </button>
                   ))}
                </div>
             </div>

             {/* Quick Stats */}
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-sm text-slate-500 uppercase mb-4">Account Stats</h3>
                <div className="space-y-4">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Joined</span>
                      <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Last Login</span>
                      <span className="font-medium text-green-600">Just Now</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Status</span>
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">Active</span>
                   </div>
                </div>
             </div>
          </div>

          {/* MAIN FORM AREA */}
          <div className="lg:col-span-3">
             <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* --- GENERAL TAB --- */}
                {activeTab === "general" && (
                   <div className="p-8 animate-in fade-in">
                      <div className="mb-6">
                         <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
                         <p className="text-sm text-slate-500">Update your personal details here.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Full Name</label>
                            <div className="relative">
                               <User className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                               <input name="name" defaultValue={user.name} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"/>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Email Address</label>
                            <div className="relative">
                               <Mail className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                               <input disabled value={user.email} className="w-full pl-10 pr-4 py-2 border bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"/>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Phone Number</label>
                            <div className="relative">
                               <Phone className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                               <input name="phone" defaultValue={user.phone || ""} placeholder="+880..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"/>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Date of Birth</label>
                            <div className="relative">
                               <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                               <input type="date" name="dob" defaultValue={user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ""} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"/>
                            </div>
                         </div>
                         <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">Address</label>
                            <div className="relative">
                               <MapPin className="absolute left-3 top-3 text-slate-400" size={18}/>
                               <textarea rows={3} name="address" defaultValue={user.address || ""} placeholder="Your office address..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"/>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* --- SECURITY TAB --- */}
                {activeTab === "security" && (
                   <div className="p-8 animate-in fade-in">
                      <div className="mb-6">
                         <h2 className="text-xl font-bold text-slate-800">Security</h2>
                         <p className="text-sm text-slate-500">Change your password and secure your account.</p>
                      </div>
                      
                      <div className="space-y-6 max-w-lg">
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Current Password</label>
                            <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border rounded-lg"/>
                         </div>
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">New Password</label>
                            <input type="password" name="newPassword" placeholder="••••••••" className="w-full px-4 py-2 border rounded-lg"/>
                         </div>
                         <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
                            ⚠️ Changing password will log you out from all other devices.
                         </div>
                      </div>
                   </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="p-6 border-t bg-slate-50 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={loading}
                     className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2 transition shadow-lg disabled:opacity-70"
                   >
                      {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                      Save Changes
                   </button>
                </div>

             </form>
          </div>
       </div>
    </div>
  );
}