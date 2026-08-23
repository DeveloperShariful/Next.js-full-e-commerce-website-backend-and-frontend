"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Avatar } from "./PostCard";
import { toggleFollow, updateProfileDetails } from "@/app/actions/frontend/community/community-social";

const BIO_MAX_LENGTH = 160;
const NICKNAME_MAX_LENGTH = 40;
const SOCIAL_LINK_SLOTS = 3;

function toSlots(links: string[]): string[] {
  const slots = [...links];
  while (slots.length < SOCIAL_LINK_SLOTS) slots.push("");
  return slots.slice(0, SOCIAL_LINK_SLOTS);
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

export default function ProfileHeader({
  profile,
}: {
  profile: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
      bio: string | null;
      nickname: string | null;
      socialLinks: string[];
      createdAt: string | Date;
    };
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

  const [bio, setBio] = useState(profile.user.bio || "");
  const [nickname, setNickname] = useState(profile.user.nickname || "");
  const [socialLinks, setSocialLinks] = useState(profile.user.socialLinks || []);

  const [isEditing, setIsEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [nicknameDraft, setNicknameDraft] = useState(nickname);
  const [linkDrafts, setLinkDrafts] = useState(toSlots(socialLinks));
  const [isSaving, startSaveTransition] = useTransition();

  const openEditor = () => {
    setBioDraft(bio);
    setNicknameDraft(nickname);
    setLinkDrafts(toSlots(socialLinks));
    setIsEditing(true);
  };

  const handleSave = () => {
    const cleanedLinks = linkDrafts.map(l => l.trim()).filter(Boolean);
    startSaveTransition(async () => {
      const res = await updateProfileDetails({ bio: bioDraft, nickname: nicknameDraft, socialLinks: cleanedLinks });
      if (res.success) {
        setBio(bioDraft.trim());
        setNickname(nicknameDraft.trim());
        setSocialLinks(cleanedLinks);
        setIsEditing(false);
        toast.success("Profile updated.");
      } else {
        toast.error(res.message || "Failed to update profile.");
      }
    });
  };

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
      <h1 className="text-[22px] font-bold text-[#050505]">
        {profile.user.name || "GoBike Rider"}
        {!isEditing && nickname && <span className="text-[15px] font-normal text-[#65676B]"> ({nickname})</span>}
      </h1>
      <p className="text-[14px] text-[#65676B] mt-1">
        <strong className="text-[#050505]">{followerCount}</strong> followers ·{" "}
        <strong className="text-[#050505]">{profile.followingCount}</strong> following
      </p>

      {isEditing ? (
        <div className="mt-3 max-w-[400px] mx-auto text-left space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-[#65676B]">Nickname</label>
            <input
              type="text"
              value={nicknameDraft}
              onChange={(e) => setNicknameDraft(e.target.value.slice(0, NICKNAME_MAX_LENGTH))}
              placeholder="e.g. Rider92"
              className="w-full text-[14px] border border-[#DADDE1] rounded-md p-2 mt-0.5 focus:outline-none focus:border-[#1877F2]"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#65676B]">Bio</label>
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value.slice(0, BIO_MAX_LENGTH))}
              rows={3}
              placeholder="Tell the community a bit about yourself and your GoBike..."
              className="w-full text-[14px] border border-[#DADDE1] rounded-md p-2 mt-0.5 resize-none focus:outline-none focus:border-[#1877F2]"
              autoFocus
            />
            <span className="text-[12px] text-[#65676B]">{bioDraft.length}/{BIO_MAX_LENGTH}</span>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#65676B]">Your social links (optional)</label>
            {linkDrafts.map((link, i) => (
              <input
                key={i}
                type="url"
                value={link}
                onChange={(e) => setLinkDrafts(drafts => drafts.map((d, di) => (di === i ? e.target.value : d)))}
                placeholder="https://instagram.com/yourname"
                className="w-full text-[14px] border border-[#DADDE1] rounded-md p-2 mt-1 focus:outline-none focus:border-[#1877F2]"
              />
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="text-[13px] font-semibold text-[#65676B] px-3 py-1 rounded-md hover:bg-[#F0F2F5]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-[13px] font-bold text-white px-3 py-1 rounded-md disabled:opacity-50"
              style={{ backgroundColor: "#1877F2" }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          {bio && <p className="mt-2 max-w-[400px] mx-auto text-[14px] text-[#050505] whitespace-pre-wrap">{bio}</p>}

          {socialLinks.length > 0 && (
            <div className="mt-2 flex flex-col items-center gap-0.5">
              {socialLinks.map(link => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer ugc nofollow"
                  className="text-[13px] font-semibold text-[#1877F2] hover:underline"
                >
                  {shortenUrl(link)}
                </a>
              ))}
            </div>
          )}

          {profile.isOwnProfile && (
            <button onClick={openEditor} className="mt-2 text-[12px] font-semibold text-[#1877F2] hover:underline">
              {bio || nickname || socialLinks.length > 0 ? "Edit profile" : "+ Add a bio"}
            </button>
          )}
        </>
      )}

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
