"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Avatar } from "./PostCard";
import { toggleFollow } from "@/app/actions/frontend/community/community-social";

export default function ProfileHeader({
  profile,
}: {
  profile: {
    user: { id: string; name: string | null; image: string | null; createdAt: string | Date };
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    isOwnProfile: boolean;
  };
}) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    if (!session?.user) { toast.error("Please sign in to follow."); return; }
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount(c => wasFollowing ? Math.max(0, c - 1) : c + 1);

    startTransition(async () => {
      const res = await toggleFollow(profile.user.id);
      if (!res.success) {
        setIsFollowing(wasFollowing);
        setFollowerCount(c => wasFollowing ? c + 1 : Math.max(0, c - 1));
        toast.error(res.message || "Failed to update follow status.");
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#DADDE1] p-5 mb-4 text-center">
      <div className="flex justify-center mb-3">
        <Avatar name={profile.user.name} image={profile.user.image} size={88} />
      </div>
      <h1 className="text-[22px] font-bold text-[#050505]">{profile.user.name || "GoBike Rider"}</h1>
      <p className="text-[14px] text-[#65676B] mt-1">
        <strong className="text-[#050505]">{followerCount}</strong> followers ·{" "}
        <strong className="text-[#050505]">{profile.followingCount}</strong> following
      </p>

      {!profile.isOwnProfile && (
        <button
          onClick={handleFollow}
          disabled={isPending}
          className={`mt-3 px-6 py-1.5 rounded-md text-[15px] font-bold transition-colors disabled:opacity-50 ${
            isFollowing ? "bg-[#E4E6EB] text-[#050505] hover:bg-[#D8DADF]" : "text-white"
          }`}
          style={!isFollowing ? { backgroundColor: "#1877F2" } : undefined}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
