// app/admin/profile/page.tsx

import { auth } from "@/auth";
import { db } from "@/lib/db";
import ProfileForm from "./profile-form"; // ✅ Importing Client Component

export default async function ProfilePage() {
  const session = await auth();
  
  // Fetch fresh data from DB
  const user = await db.user.findUnique({
    where: { id: session?.user?.id }
  });

  if (!user) return <div>User not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500">Manage your account settings and preferences.</p>
      </div>

      {/* Client Form Component */}
      <ProfileForm user={user} />
    </div>
  );
}