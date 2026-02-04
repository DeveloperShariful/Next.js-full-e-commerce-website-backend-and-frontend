//app/(storefront)/affiliates/register/page.tsx

import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RegisterForm from "./_components/register-form";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";
import { serializePrismaData } from "@/lib/format-data";
import { Star, ShieldCheck, Zap } from "lucide-react"; 

export const metadata = {
  title: "Become a Partner | GoBike Enterprise",
};

export default async function RegisterPage() {
  const userId = await requireUser();

  const [existingAccount, user, settings] = await Promise.all([
    db.affiliateAccount.findUnique({ where: { userId } }),
    db.user.findUnique({ 
        where: { id: userId },
        select: { name: true, email: true, image: true } 
    }),
    db.storeSettings.findUnique({ 
        where: { id: "settings" },
        select: { affiliateConfig: true }
    })
  ]);

  if (existingAccount) redirect("/affiliates");

  const config = settings?.affiliateConfig as any;
  if (config?.registrationEnabled === false) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center">
            <h2 className="text-2xl font-bold">Applications Closed</h2>
        </div>
    );
  }

  const serializedUser = serializePrismaData(user);

  return (
    <div className="flex min-h-screen w-full bg-white">
      <div className="hidden lg:flex w-5/12 bg-black text-white flex-col justify-between p-12 relative overflow-hidden sticky top-0 h-screen">
         <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px]" />
         
         <div className="relative z-10">
             <div className="font-bold text-2xl tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg" /> GoBike.
             </div>
             
             <div className="mt-20 space-y-8">
                 <h1 className="text-5xl font-extrabold leading-tight">
                    Turn your audience <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">into income.</span>
                 </h1>
                 <p className="text-lg text-slate-300 max-w-md">
                    Join the fastest-growing partner network. Get paid for every sale, access exclusive tools, and grow your brand.
                 </p>
             </div>
         </div>
         <div className="relative z-10 space-y-6">
             <div className="flex gap-4">
                 {[1,2,3].map(i => (
                     <div key={i} className="flex flex-col bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full">
                         {i === 1 && <Zap className="w-6 h-6 text-yellow-400 mb-2"/>}
                         {i === 2 && <Star className="w-6 h-6 text-purple-400 mb-2"/>}
                         {i === 3 && <ShieldCheck className="w-6 h-6 text-green-400 mb-2"/>}
                         <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            {i === 1 ? "Fast Payouts" : i === 2 ? "Top Commission" : "Secure System"}
                         </span>
                         <span className="text-sm font-semibold text-white mt-1">
                            {i === 1 ? "Net-15 Terms" : i === 2 ? "Up to 20%" : "Fraud Protection"}
                         </span>
                     </div>
                 ))}
             </div>
             <p className="text-xs text-slate-500">© 2026 GoBike Inc. All rights reserved.</p>
         </div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto">
         <div className="w-full max-w-4xl"> 
             <RegisterForm user={serializedUser} />
         </div>
      </div>

    </div>                                        
  );
}