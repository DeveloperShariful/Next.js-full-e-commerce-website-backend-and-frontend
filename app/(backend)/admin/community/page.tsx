import type { Metadata } from "next";
import CommunityModerationClient from "./_components/CommunityModerationClient";
import { getPendingReports, getAllCommunityPostsAdmin } from "@/app/actions/backend/community/community-moderation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Moderation ‹ GoBike Admin",
};

export default async function AdminCommunityPage() {
  const [reportsRes, postsRes] = await Promise.all([
    getPendingReports(),
    getAllCommunityPostsAdmin(1),
  ]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0">Community Moderation</h1>
        <p className="text-[13px] text-[#646970] mt-1">Review reported posts/comments and manage the public community feed.</p>
      </div>

      <CommunityModerationClient
        reports={reportsRes.success ? reportsRes.reports : []}
        posts={postsRes.success ? postsRes.posts : []}
      />
    </div>
  );
}
