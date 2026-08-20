import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import CommunityTopNav from "../_components/CommunityTopNav";
import SearchResultsClient from "../_components/SearchResultsClient";
import { searchCommunity } from "@/app/actions/frontend/community/community-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search | GoBike Community" };

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function CommunitySearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const result = query ? await searchCommunity(query) : { success: true, posts: [], users: [] };

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <CommunityTopNav />

      <div className="bg-white border-b border-[#DADDE1]">
        <form action="/community/search" method="GET" className="max-w-[680px] mx-auto px-4 py-3">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search posts, tags, or people..."
            className="w-full bg-[#F0F2F5] rounded-full px-4 py-2 text-[15px] outline-none focus:ring-2"
            style={{ ["--tw-ring-color" as string]: "#1877F2" }}
          />
        </form>
      </div>

      <div className="py-4 px-3 sm:px-0">
        {query ? (
          <SearchResultsClient posts={result.posts || []} users={result.users || []} query={query} />
        ) : (
          <p className="max-w-[680px] mx-auto text-center text-[#65676B] py-10">Type something above to search.</p>
        )}
      </div>
    </div>
  );
}
