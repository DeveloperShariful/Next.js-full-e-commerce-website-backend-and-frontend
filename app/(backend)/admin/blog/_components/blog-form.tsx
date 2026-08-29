"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadMediaFile } from "@/lib/upload-media";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { fromZonedTime } from "date-fns-tz";
import { createBlogPost, updateBlogPost, type BlogPostFormData } from "@/app/actions/backend/blog/blog-actions";
import { saveMediaRecord } from "@/app/actions/backend/media/media-action";
import { BackButton } from "@/app/(backend)/admin/_components/back-button";
import MediaPickerModal, { type PickedMedia } from "@/app/(backend)/admin/media/_components/MediaPickerModal";
import { MediaSource } from "@prisma/client";

const RichTextEditor = dynamic(
  () => import("@/app/(backend)/admin/products/create/_components/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-500 rounded border border-[#c3c4c7]">
        Loading Editor...
      </div>
    ),
  }
);

interface BlogCategory {
  id: string;
  name: string;
  color: string | null;
}

interface BlogAuthor {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
  role: string;
}

interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
}

interface BlogFormProps {
  categories: BlogCategory[];
  authors: BlogAuthor[];
  allPosts?: BlogPostSummary[];
  storeTimezone?: string;
  initialData?: Partial<BlogPostFormData> & {
    id?: string;
    slug?: string;
    viewCount?: number;
    tags?: string[];
    relatedPostIds?: string[];
    faqs?: { question: string; answer: string }[];
    author?: { id: string; name: string | null; image: string | null } | null;
  };
  isEdit?: boolean;
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BlogForm({ categories, authors, allPosts, storeTimezone = "UTC", initialData, isEdit }: BlogFormProps) {
  const router = useRouter();
  const ogImgInputRef = useRef<HTMLInputElement>(null);
  const featuredImgInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BlogPostFormData>({
    title: initialData?.title ?? "",
    content: initialData?.content ?? "",
    excerpt: initialData?.excerpt ?? "",
    featuredImage: initialData?.featuredImage ?? "",
    featuredImageAlt: initialData?.featuredImageAlt ?? "",
    videoUrl: initialData?.videoUrl ?? "",
    videoThumbnail: initialData?.videoThumbnail ?? "",
    categoryId: initialData?.categoryId ?? "",
    authorId: initialData?.authorId ?? "",
    tags: initialData?.tags ?? [],
    keyTakeaways: initialData?.keyTakeaways ?? [],
    authorBio: initialData?.authorBio ?? "",
    status: initialData?.status ?? "DRAFT",
    isFeatured: initialData?.isFeatured ?? false,
    isPinned: initialData?.isPinned ?? false,
    readTimeMinutes: initialData?.readTimeMinutes ?? undefined,
    metaTitle: initialData?.metaTitle ?? "",
    metaDesc: initialData?.metaDesc ?? "",
    ogImage: initialData?.ogImage ?? "",
    canonicalUrl: initialData?.canonicalUrl ?? "",
    noIndex: initialData?.noIndex ?? false,
    robots: initialData?.robots ?? "",
    focusKeyword: initialData?.focusKeyword ?? "",
    ogTitle: initialData?.ogTitle ?? "",
    ogDescription: initialData?.ogDescription ?? "",
    twitterTitle: initialData?.twitterTitle ?? "",
    twitterDescription: initialData?.twitterDescription ?? "",
    twitterCard: initialData?.twitterCard ?? "summary_large_image",
    schemaType: initialData?.schemaType ?? "BlogPosting",
    publishedAt: initialData?.publishedAt ?? "",
    scheduledAt: initialData?.scheduledAt ?? undefined,
    relatedPostIds: initialData?.relatedPostIds ?? [],
    faqs: initialData?.faqs ?? [],
  });

  const [slug, setSlug] = useState(() =>
    isEdit && initialData?.slug ? initialData.slug : toSlug(initialData?.title ?? "")
  );
  const [slugEdited, setSlugEdited] = useState(isEdit && !!initialData?.slug);
  const [slugEditMode, setSlugEditMode] = useState(false);
  const [slugInput, setSlugInput] = useState("");

  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [thumbModalOpen, setThumbModalOpen] = useState(false);
  const [featuredImgModalOpen, setFeaturedImgModalOpen] = useState(false);
  const [ogImgModalOpen, setOgImgModalOpen] = useState(false);

  // noFollow: UI toggle that writes into the robots string field (no extra DB column needed)
  const [noFollow, setNoFollow] = useState(() => (initialData?.robots ?? "").includes("nofollow"));

  // Related posts search
  const [relatedSearch, setRelatedSearch] = useState("");

  const set = (key: keyof BlogPostFormData, value: unknown) =>
    setForm((p) => ({ ...p, [key]: value }));

  // ── Word count + auto read time ──────────────────────────────────────────
  const wordCount = useMemo(
    () =>
      form.content
        ? form.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length
        : 0,
    [form.content]
  );
  const autoReadTime = Math.max(1, Math.ceil(wordCount / 200));

  // ── Focus keyword SEO analysis ───────────────────────────────────────────
  const kwAnalysis = useMemo(() => {
    const kw = (form.focusKeyword ?? "").toLowerCase().trim();
    if (!kw) return null;
    const plainContent = form.content.replace(/<[^>]*>/g, " ").toLowerCase();
    const safeKw = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const kwCount = (plainContent.match(new RegExp(safeKw, "gi")) || []).length;
    const density = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;
    return {
      inTitle: (form.metaTitle || form.title).toLowerCase().includes(kw),
      inDesc: (form.metaDesc || form.excerpt || "").toLowerCase().includes(kw),
      inSlug: slug.toLowerCase().includes(kw.replace(/\s+/g, "-")),
      inFirstPara: plainContent.substring(0, 500).includes(kw),
      inAlt: (form.featuredImageAlt ?? "").toLowerCase().includes(kw),
      density: density.toFixed(1),
      densityGood: density >= 0.5 && density <= 2.5,
      kwCount,
    };
  }, [form.focusKeyword, form.metaTitle, form.title, form.metaDesc, form.excerpt, form.content, form.featuredImageAlt, slug, wordCount]);

  // ── Related posts helpers ────────────────────────────────────────────────
  const filteredPosts = useMemo(
    () =>
      (allPosts ?? []).filter(
        (p) =>
          p.id !== initialData?.id &&
          p.title.toLowerCase().includes(relatedSearch.toLowerCase())
      ),
    [allPosts, relatedSearch, initialData?.id]
  );

  const selectedRelatedPosts = useMemo(
    () => (allPosts ?? []).filter((p) => (form.relatedPostIds ?? []).includes(p.id)),
    [allPosts, form.relatedPostIds]
  );

  const toggleRelated = (postId: string) => {
    const current = form.relatedPostIds ?? [];
    set(
      "relatedPostIds",
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]
    );
  };

  // ── noFollow: encodes into robots string, no extra DB field ──────────────
  const handleNoFollowChange = (checked: boolean) => {
    setNoFollow(checked);
    if (checked) {
      set("robots", form.noIndex ? "noindex, nofollow" : "index, nofollow");
    } else {
      const r = form.robots ?? "";
      if (r === "noindex, nofollow" || r === "index, nofollow") {
        set("robots", "");
      }
    }
  };

  const addTag = () => {
    const parts = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && !(form.tags ?? []).includes(t));
    if (parts.length > 0) set("tags", [...(form.tags ?? []), ...parts]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    set("tags", (form.tags ?? []).filter((t) => t !== tag));

  // ── FAQ helpers ──────────────────────────────────────────────────────────
  const addFaq = () =>
    set("faqs", [...(form.faqs ?? []), { question: "", answer: "" }]);

  const removeFaq = (index: number) =>
    set("faqs", (form.faqs ?? []).filter((_, i) => i !== index));

  const updateFaq = (index: number, key: "question" | "answer", value: string) =>
    set(
      "faqs",
      (form.faqs ?? []).map((f, i) => (i === index ? { ...f, [key]: value } : f))
    );

  const handleImageUpload = async (file: File, field: "featuredImage" | "ogImage" | "videoUrl" | "videoThumbnail") => {
    setIsUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, 'blog');
      set(field, uploaded.url);
      // Save to media library DB so it appears in admin media page
      await saveMediaRecord({
        url: uploaded.url,
        pathname: uploaded.pathname,
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        source: MediaSource.BLOG,
      });
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (status: BlogPostFormData["status"]) => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.content.trim()) return toast.error("Content is required");
    setIsSubmitting(true);
    // Convert datetime-local strings (entered in store timezone) → UTC ISO strings for server
    const publishedAtISO = form.publishedAt
      ? fromZonedTime(form.publishedAt, storeTimezone).toISOString()
      : "";
    const scheduledAtISO = form.scheduledAt
      ? fromZonedTime(form.scheduledAt, storeTimezone).toISOString()
      : undefined;
    const data = { ...form, slug, status, publishedAt: publishedAtISO, scheduledAt: scheduledAtISO };
    const res =
      isEdit && initialData?.id
        ? await updateBlogPost(initialData.id, data)
        : await createBlogPost(data);
    setIsSubmitting(false);
    if (res.success) {
      toast.success(isEdit ? "Post updated" : "Post created");
      const returnUrl = sessionStorage.getItem("blog-return-url") || "/admin/blog";
      router.push(returnUrl, { scroll: false });
    } else {
      toast.error(res.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">
      <div className="px-3 md:px-0 mb-4">
        <BackButton storageKey="blog-return-url" fallbackUrl="/admin/blog" label="Back to posts" />
      </div>

      <div className="px-1 md:px-0 flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-normal text-[#1d2327] m-0 leading-tight">
          {isEdit ? "Edit Post" : "Add New Post"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit("DRAFT")}
            disabled={isSubmitting || isUploading}
            className="px-2 py-1 text-[13px] border border-[#c3c4c7] bg-white text-[#2c3338] rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit("PUBLISHED")}
            disabled={isSubmitting || isUploading}
            className="px-2 py-1 text-[13px] bg-[#2271b1] text-white rounded hover:bg-[#135e96] disabled:opacity-50 font-medium"
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/*
        Layout: Mobile → flex-col + display:contents / Desktop → xl:grid 2-col
      */}
      <div className="flex flex-col gap-px xl:grid xl:grid-cols-[1fr_320px] xl:gap-5">

        {/* ════════════════ LEFT COLUMN ════════════════ */}
        <div className="contents xl:block xl:space-y-5">

          {/* ── Title (mobile order 2) ── */}
          <div className="order-2 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-5">
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugEdited) setSlug(toSlug(e.target.value));
              }}
              placeholder="Post title"
              className="w-full text-[22px] font-semibold border-0 outline-none text-[#1d2327] placeholder:text-[#c3c4c7] placeholder:font-normal"
            />
            <div className="mt-2 pt-2 border-t border-[#f0f0f1]">
              {!slugEditMode ? (
                <div className="flex items-center gap-1.5 flex-wrap text-[12px]">
                  <span className="text-[#646970]">
                    Permalink: <span className="font-mono text-[#1d2327]">/blog/{slug || "post-slug"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { setSlugInput(slug); setSlugEditMode(true); }}
                    className="text-[#2271b1] hover:underline"
                  >
                    Edit
                  </button>
                  {slugEdited && (
                    <button
                      type="button"
                      onClick={() => { setSlug(toSlug(form.title)); setSlugEdited(false); }}
                      className="text-[#646970] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#646970] shrink-0">/blog/</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { const s = toSlug(slugInput); setSlug(s || toSlug(form.title)); setSlugEdited(true); setSlugEditMode(false); }
                      if (e.key === "Escape") setSlugEditMode(false);
                    }}
                    className="flex-1 min-w-0 text-[12px] font-mono border border-[#2271b1] rounded px-2 py-1 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { const s = toSlug(slugInput); setSlug(s || toSlug(form.title)); setSlugEdited(true); setSlugEditMode(false); }}
                    className="text-[12px] font-semibold text-[#2271b1] hover:text-[#135e96] shrink-0"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlugEditMode(false)}
                    className="text-[12px] text-[#646970] hover:text-[#1d2327] shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Content + Excerpt (mobile order 3) ── */}
          <div className="order-3 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1 space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#1d2327] mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                label="Blog Content"
                id="blog-content-editor"
                value={form.content}
                onChange={(val) => set("content", val)}
              />
              {/* Word count + auto read time */}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#646970]">
                <span>{wordCount.toLocaleString()} words</span>
                <span>·</span>
                <span>~{autoReadTime} min read</span>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1d2327] mb-1.5">Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={3}
                placeholder="Short summary shown in post listings..."
                className="w-full px-4 py-3 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-none"
              />
            </div>
          </div>

          {/* ── FAQ (mobile order 4) ── */}
          <div className="order-4 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#1d2327]">FAQ</h3>
              <span className="text-[11px] text-[#646970] bg-[#f0f0f1] px-2 py-0.5 rounded">
                {(form.faqs ?? []).length} question{(form.faqs ?? []).length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[11px] text-[#646970]">
              Shown as a visible &quot;Frequently Asked Questions&quot; section at the bottom of
              the post, and automatically included as FAQPage structured data. Answers support{" "}
              <strong>Markdown</strong> — <code>**bold**</code>, <code>[link text](https://...)</code>,
              and blank lines between paragraphs.
            </p>

            <div className="space-y-3">
              {(form.faqs ?? []).map((faq, i) => (
                <div key={i} className="border border-[#c3c4c7] rounded p-3 space-y-2 bg-[#f9f9f9]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">
                      Question {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFaq(i)}
                      className="text-[12px] text-red-500 hover:text-red-700 font-semibold"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    placeholder="e.g. Is there a genuinely good electric dirt bike under $1,000?"
                    className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] bg-white"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                    rows={4}
                    placeholder={"Answer text — Markdown supported, e.g.\nYes, for the youngest age bracket — an entry-level model like the **GoBike 12\"** sits under this price. See our [size guide](/blog/what-age-for-electric-balance-bike) for details."}
                    className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] bg-white resize-y font-mono"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addFaq}
              className="w-full px-3 py-2 text-[13px] font-semibold border border-dashed border-[#2271b1] text-[#2271b1] rounded hover:bg-[#f0f8ff]"
            >
              + Add Question
            </button>
          </div>

          {/* ── SEO (mobile order 11) ── */}
          <div className="order-11 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-5 space-y-5">

            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#1d2327]">SEO</h3>
              <span className="text-[11px] text-[#646970] bg-[#f0f0f1] px-2 py-0.5 rounded">
                Empty fields = auto-generated
              </span>
            </div>

            {/* Focus Keyword */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Focus Keyword</label>
              <input
                type="text"
                value={form.focusKeyword ?? ""}
                onChange={(e) => set("focusKeyword", e.target.value)}
                placeholder="e.g. electric bike for kids australia"
                className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
              />
              <p className="text-[11px] text-[#646970] mt-1">
                Primary keyword this post targets — SEO analysis updates in real time below.
              </p>

              {/* Live SEO Analysis */}
              {kwAnalysis && (
                <div className="mt-3 p-3 bg-[#f6f7f7] rounded border border-[#c3c4c7] space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide mb-2">
                    SEO Analysis
                  </p>
                  {[
                    { label: "Keyword in page title", ok: kwAnalysis.inTitle },
                    { label: "Keyword in meta description", ok: kwAnalysis.inDesc },
                    { label: "Keyword in URL / slug", ok: kwAnalysis.inSlug },
                    { label: "Keyword in first paragraph", ok: kwAnalysis.inFirstPara },
                    { label: "Keyword in featured image alt text", ok: kwAnalysis.inAlt },
                    {
                      label: `Keyword density: ${kwAnalysis.density}% — ideal 0.5–2.5% (found ${kwAnalysis.kwCount}×)`,
                      ok: kwAnalysis.densityGood,
                    },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold ${
                          ok ? "bg-green-500" : "bg-red-400"
                        }`}
                      >
                        {ok ? "✓" : "✗"}
                      </span>
                      <span className={`text-[12px] ${ok ? "text-[#1d2327]" : "text-[#646970]"}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Basic SEO */}
            <div className="border-t border-[#f0f0f1] pt-4 space-y-4">
              <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">Basic SEO</p>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Meta Title</label>
                <input
                  type="text"
                  value={form.metaTitle ?? ""}
                  onChange={(e) => set("metaTitle", e.target.value)}
                  placeholder={`Auto: ${form.title ? `${form.title} | GoBike Australia` : "Post Title | GoBike Australia"}`}
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-[#646970]">
                    Auto: <span className="font-mono">{form.title ? `${form.title} | GoBike Australia` : "Post Title | GoBike Australia"}</span>
                  </p>
                  <p
                    className={`text-[11px] font-medium ${
                      (form.metaTitle || "").length > 70
                        ? "text-red-500"
                        : (form.metaTitle || "").length > 60
                        ? "text-yellow-600"
                        : "text-[#646970]"
                    }`}
                  >
                    {(form.metaTitle || "").length}/60
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Meta Description</label>
                <textarea
                  value={form.metaDesc ?? ""}
                  onChange={(e) => set("metaDesc", e.target.value)}
                  rows={3}
                  placeholder={form.excerpt ? form.excerpt.slice(0, 160) : "Auto-generated from excerpt…"}
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-[#646970]">Ideal: 120–160 characters</p>
                  <p
                    className={`text-[11px] font-medium ${
                      (form.metaDesc || "").length > 200
                        ? "text-red-500"
                        : (form.metaDesc || "").length > 160
                        ? "text-yellow-600"
                        : "text-[#646970]"
                    }`}
                  >
                    {(form.metaDesc || "").length}/160
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Canonical URL</label>
                <input
                  type="url"
                  value={form.canonicalUrl ?? ""}
                  onChange={(e) => set("canonicalUrl", e.target.value)}
                  placeholder={`Auto: https://gobike.au/blog/${slug || "post-slug"}`}
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
                />
                <p className="text-[11px] text-[#646970] mt-1">
                  Auto: <span className="font-mono">https://gobike.au/blog/{slug || "post-slug"}</span>
                </p>
              </div>
            </div>

            {/* Robots & Indexing */}
            <div className="border-t border-[#f0f0f1] pt-4 space-y-3">
              <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">
                Robots & Indexing
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.noIndex ?? false}
                    onChange={(e) => {
                      set("noIndex", e.target.checked);
                      // Keep noFollow robots string in sync
                      if (noFollow) {
                        set("robots", e.target.checked ? "noindex, nofollow" : "index, nofollow");
                      }
                    }}
                    className="w-4 h-4 rounded border-[#c3c4c7]"
                  />
                  <span className="text-[13px] text-[#1d2327]">
                    No Index{" "}
                    <span className="text-[#646970] font-normal">(hide from search engine index)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noFollow}
                    onChange={(e) => handleNoFollowChange(e.target.checked)}
                    className="w-4 h-4 rounded border-[#c3c4c7]"
                  />
                  <span className="text-[13px] text-[#1d2327]">
                    No Follow{" "}
                    <span className="text-[#646970] font-normal">
                      (don&apos;t pass link authority to outbound links)
                    </span>
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">
                  Custom Robots
                </label>
                <input
                  type="text"
                  value={form.robots ?? ""}
                  onChange={(e) => {
                    set("robots", e.target.value);
                    setNoFollow(e.target.value.includes("nofollow"));
                  }}
                  placeholder="Auto: index, follow, max-snippet:-1, max-image-preview:large"
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] font-mono"
                />
                <p className="text-[11px] text-[#646970] mt-1">
                  Advanced: override robots directives. Leave empty for default.
                </p>
              </div>
            </div>

            {/* Google Preview */}
            <div className="border-t border-[#f0f0f1] pt-4">
              <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide mb-3">
                Google Search Preview
              </p>
              <div className="border border-[#c3c4c7] rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                  <span className="text-[12px] text-[#646970]">GoBike Australia · gobike.au</span>
                </div>
                <p className="text-[#1a0dab] text-[17px] leading-snug font-normal hover:underline cursor-pointer truncate">
                  {form.metaTitle ||
                    (form.title ? `${form.title} | GoBike Australia` : "Post Title | GoBike Australia")}
                </p>
                <p className="text-[#006621] text-[12px] mt-0.5">
                  https://gobike.au/blog/{slug || "post-slug"}
                </p>
                <p className="text-[#545454] text-[13px] mt-1 leading-snug line-clamp-2">
                  {form.metaDesc || form.excerpt || "No description set."}
                </p>
              </div>
            </div>

            {/* Open Graph */}
            <div className="border-t border-[#f0f0f1] pt-4 space-y-4">
              <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">
                Open Graph (Facebook / LinkedIn / WhatsApp)
              </p>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">OG Image</label>
                {form.ogImage ? (
                  <div className="mb-2 relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.ogImage}
                      alt="OG"
                      className="h-24 rounded border border-[#c3c4c7] object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => set("ogImage", "")}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#646970] mb-2">Auto: uses Featured Image if empty</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setOgImgModalOpen(true)}
                    className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50"
                  >
                    Select from Library
                  </button>
                  <span className="text-[11px] text-[#646970]">or</span>
                  <input
                    ref={ogImgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f, "ogImage");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => ogImgInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
                <p className="text-[11px] text-[#646970] mt-1">Recommended: 1200×630px</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">OG Title</label>
                <input
                  type="text"
                  value={form.ogTitle ?? ""}
                  onChange={(e) => set("ogTitle", e.target.value)}
                  placeholder={`Auto: ${form.metaTitle || (form.title ? `${form.title} | GoBike Australia` : "Meta Title")}`}
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">OG Description</label>
                <textarea
                  value={form.ogDescription ?? ""}
                  onChange={(e) => set("ogDescription", e.target.value)}
                  rows={2}
                  placeholder="Auto: uses Meta Description if empty"
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-none"
                />
              </div>
            </div>

            {/* Twitter / X Card */}
            <div className="border-t border-[#f0f0f1] pt-4 space-y-4">
              <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">
                Twitter / X Card
              </p>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Card Type</label>
                <select
                  value={form.twitterCard ?? "summary_large_image"}
                  onChange={(e) => set("twitterCard", e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] bg-white"
                >
                  <option value="summary_large_image">Summary Large Image (recommended)</option>
                  <option value="summary">Summary (small image)</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Twitter Title</label>
                <input
                  type="text"
                  value={form.twitterTitle ?? ""}
                  onChange={(e) => set("twitterTitle", e.target.value)}
                  placeholder="Auto: uses Meta Title if empty"
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">
                  Twitter Description
                </label>
                <textarea
                  value={form.twitterDescription ?? ""}
                  onChange={(e) => set("twitterDescription", e.target.value)}
                  rows={2}
                  placeholder="Auto: uses Meta Description if empty"
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-none"
                />
              </div>

              <div>
                <p className="text-[13px] font-semibold text-[#1d2327] mb-0.5">Twitter Image</p>
                <p className="text-[11px] text-[#646970]">
                  Auto: uses OG Image → Featured Image as fallback.
                </p>
              </div>
            </div>

            {/* Schema.org */}
            <div className="border-t border-[#f0f0f1] pt-4 space-y-4">
              <p className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">
                Schema.org (JSON-LD)
              </p>

              <div>
                <label className="block text-[13px] font-semibold text-[#1d2327] mb-1">Schema Type</label>
                <select
                  value={form.schemaType ?? "BlogPosting"}
                  onChange={(e) => set("schemaType", e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] bg-white"
                >
                  <option value="BlogPosting">BlogPosting (standard blog)</option>
                  <option value="Article">Article (news / editorial)</option>
                  <option value="NewsArticle">NewsArticle (breaking news)</option>
                  <option value="TechArticle">TechArticle (technical guide)</option>
                  <option value="HowTo">HowTo (step-by-step guide)</option>
                </select>
                <p className="text-[11px] text-[#646970] mt-1">
                  Determines the structured data type sent to Google.
                </p>
              </div>

              {/* JSON-LD Preview */}
              <details className="border border-[#c3c4c7] rounded">
                <summary className="px-3 py-2 text-[12px] font-semibold text-[#646970] cursor-pointer hover:bg-[#f6f7f7] select-none">
                  ▶ Preview JSON-LD Schema (what Google will see)
                </summary>
                <pre className="p-3 text-[10px] font-mono text-[#3c434a] bg-[#f6f7f7] overflow-x-auto leading-relaxed rounded-b whitespace-pre-wrap break-words">
{JSON.stringify(
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": form.schemaType || "BlogPosting",
        headline: form.metaTitle || form.title || "Post Title",
        description: form.metaDesc || form.excerpt || "",
        image:
          form.ogImage || form.featuredImage
            ? [
                {
                  "@type": "ImageObject",
                  url: form.ogImage || form.featuredImage,
                  width: 1200,
                  height: 630,
                },
              ]
            : [],
        author: { "@type": "Person", name: "Author Name", url: "https://gobike.au" },
        publisher: {
          "@type": "Organization",
          name: "GoBike Australia",
          logo: {
            "@type": "ImageObject",
            url: "https://gobikes.au/wp-content/uploads/2025/06/cropped-GOBIKE-Electric-Bike-for-kids-1.webp",
          },
        },
        datePublished: new Date().toISOString().split("T")[0],
        dateModified: new Date().toISOString().split("T")[0],
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://gobike.au/blog/${slug || "post-slug"}`,
        },
        url: `https://gobike.au/blog/${slug || "post-slug"}`,
        keywords: (form.tags ?? []).join(", ") || undefined,
        wordCount,
        inLanguage: "en-AU",
        articleSection: categories.find((c) => c.id === form.categoryId)?.name || undefined,
        isPartOf: { "@id": "https://gobike.au/blog" },
        ...(form.readTimeMinutes ? { timeRequired: `PT${form.readTimeMinutes}M` } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://gobike.au" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://gobike.au/blog" },
          {
            "@type": "ListItem",
            position: 3,
            name: form.title || "Post Title",
            item: `https://gobike.au/blog/${slug || "post-slug"}`,
          },
        ],
      },
      ...(form.videoUrl
        ? [
            {
              "@type": "VideoObject",
              name: form.title || "Post Title",
              description: form.metaDesc || form.excerpt || "",
              thumbnailUrl: form.videoThumbnail || form.featuredImage || "",
              uploadDate: new Date().toISOString().split("T")[0],
              contentUrl: form.videoUrl,
              publisher: { "@type": "Organization", name: "GoBike Australia" },
            },
          ]
        : []),
      ...((form.faqs ?? []).filter((f) => f.question.trim() && f.answer.trim()).length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: (form.faqs ?? [])
                .filter((f) => f.question.trim() && f.answer.trim())
                .map((f) => ({
                  "@type": "Question",
                  name: f.question,
                  acceptedAnswer: { "@type": "Answer", text: f.answer },
                })),
            },
          ]
        : []),
    ],
  },
  null,
  2
)}
                </pre>
              </details>
            </div>
          </div>

          {/* ── Key Takeaways (mobile order 12) ── */}
          <div className="order-12 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1">
            <h3 className="text-[13px] font-semibold text-[#1d2327] mb-1">Key Takeaways</h3>
            <p className="text-[11px] text-[#646970] mb-2">
              One point per line. Leave empty to use global default takeaways.
            </p>
            <textarea
              value={(form.keyTakeaways ?? []).join("\n")}
              onChange={(e) =>
                set(
                  "keyTakeaways",
                  e.target.value
                    .split("\n")
                    .map((l) => l.trimStart())
                    .filter((l) => l.length > 0)
                )
              }
              rows={5}
              placeholder={"Electric bikes are safer than...\nAlways wear a helmet...\nChoose the right size..."}
              className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-y font-mono"
            />
            <p className="text-[11px] text-[#646970] mt-1">
              {(form.keyTakeaways ?? []).length} point
              {(form.keyTakeaways ?? []).length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* ── Author Bio (mobile order 13) ── */}
          <div className="order-13 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1">
            <h3 className="text-[13px] font-semibold text-[#1d2327] mb-1">Author Bio (for this post)</h3>
            <p className="text-[11px] text-[#646970] mb-2">Leave empty to use global default bio.</p>
            <textarea
              value={form.authorBio ?? ""}
              onChange={(e) => set("authorBio", e.target.value)}
              rows={4}
              placeholder="Australia's leading provider of premium electric bikes..."
              className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-none"
            />
          </div>

          {/* ── Related Posts (mobile order 14) ── */}
          <div className="order-14 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#1d2327]">Related Posts</h3>
              <span className="text-[11px] text-[#646970] bg-[#f0f0f1] px-2 py-0.5 rounded">
                {(form.relatedPostIds ?? []).length} selected
              </span>
            </div>
            <p className="text-[11px] text-[#646970]">
              Shown as &quot;Recommended Reading&quot; at the bottom of this post. Leave empty for
              auto-suggested posts from the same category.
            </p>

            {/* Selected posts */}
            {selectedRelatedPosts.length > 0 && (
              <div className="space-y-1">
                {selectedRelatedPosts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 bg-[#f0f8ff] rounded border border-[#2271b1]/20"
                  >
                    <span className="text-[13px] text-[#1d2327] truncate flex-1 min-w-0 mr-2">
                      {p.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRelated(p.id)}
                      className="shrink-0 text-[12px] text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search + picker */}
            {(allPosts ?? []).length > 0 ? (
              <div>
                <input
                  type="text"
                  value={relatedSearch}
                  onChange={(e) => setRelatedSearch(e.target.value)}
                  placeholder="Search posts by title to add..."
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
                />
                {relatedSearch && (
                  <div className="mt-1 border border-[#c3c4c7] rounded divide-y divide-[#f0f0f1] max-h-52 overflow-y-auto">
                    {filteredPosts.length === 0 ? (
                      <p className="px-3 py-2 text-[13px] text-[#646970]">No matching posts found.</p>
                    ) : (
                      filteredPosts.slice(0, 12).map((p) => {
                        const isSelected = (form.relatedPostIds ?? []).includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleRelated(p.id)}
                            className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f6f7f7] flex items-center justify-between gap-2"
                          >
                            <span className="truncate flex-1">{p.title}</span>
                            <span
                              className={`shrink-0 text-[11px] font-semibold ${
                                isSelected ? "text-green-600" : "text-[#2271b1]"
                              }`}
                            >
                              {isSelected ? "✓ Added" : "+ Add"}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-[#646970] italic">
                No other published posts available yet.
              </p>
            )}
          </div>
        </div>

        {/* ════════════════ RIGHT SIDEBAR ════════════════ */}
        <div className="contents xl:block xl:space-y-4">

          {/* ── Publish (mobile order 1) ── */}
          <div className="order-1 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1 space-y-4">
            <h3 className="text-[13px] font-semibold text-[#1d2327]">Publish</h3>

            {isEdit && (
              <div>
                <label className="block text-[12px] font-semibold text-[#646970] mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as BlogPostFormData["status"])}
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] bg-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => set("isFeatured", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#c3c4c7] shrink-0"
                />
                <div>
                  <p className="text-[13px] font-semibold text-[#1d2327] leading-tight">Featured</p>
                  <p className="text-[11px] text-[#646970] leading-tight mt-0.5">Highlight on blog</p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => set("isPinned", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#c3c4c7] shrink-0"
                />
                <div>
                  <p className="text-[13px] font-semibold text-[#1d2327] leading-tight">Pinned</p>
                  <p className="text-[11px] text-[#646970] leading-tight mt-0.5">Show at top</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#646970] mb-1.5">
                Read Time (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={form.readTimeMinutes ?? ""}
                onChange={(e) =>
                  set("readTimeMinutes", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder={`Auto: ~${autoReadTime} min`}
                className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
              />
              <p className="text-[11px] text-[#646970] mt-1">
                Auto-estimate: {wordCount.toLocaleString()} words ÷ 200 wpm = ~{autoReadTime} min
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#646970] mb-1.5">
                Published Date <span className="font-normal text-[#646970]">({storeTimezone})</span>
              </label>
              <input
                type="datetime-local"
                value={form.publishedAt ?? ""}
                onChange={(e) => set("publishedAt", e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
              />
              <p className="text-[11px] text-[#646970] mt-1">
                Set the original date when migrating old posts. Leave empty to auto-set on publish.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#646970] mb-1.5">
                Scheduled Publish Date <span className="font-normal text-[#646970]">({storeTimezone})</span>
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt ?? ""}
                onChange={(e) => set("scheduledAt", e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
              />
              <p className="text-[11px] text-[#646970] mt-1">Set status to SCHEDULED to use this.</p>
            </div>
          </div>

          {/* ── Featured Image (mobile order 5) ── */}
          <div className="order-5 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1">
            <h3 className="text-[13px] font-semibold text-[#1d2327] mb-3">Featured Image</h3>
            {form.featuredImage ? (
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.featuredImage}
                  alt={form.featuredImageAlt || "Featured"}
                  className="w-full rounded border border-[#c3c4c7] object-cover max-h-48"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFeaturedImgModalOpen(true)}
                    className="text-white text-[12px] bg-black/60 rounded px-3 py-1.5 hover:bg-black/80"
                  >
                    Library
                  </button>
                  <button
                    type="button"
                    onClick={() => featuredImgInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-white text-[12px] bg-black/60 rounded px-3 py-1.5 hover:bg-black/80 disabled:opacity-50"
                  >
                    {isUploading ? "..." : "Upload"}
                  </button>
                  <button
                    type="button"
                    onClick={() => set("featuredImage", "")}
                    className="text-white bg-red-500/80 rounded p-1.5 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 border-2 border-dashed border-[#c3c4c7] rounded flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFeaturedImgModalOpen(true)}
                    className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50"
                  >
                    Select from Library
                  </button>
                  <span className="text-[11px] text-[#646970]">or</span>
                  <button
                    type="button"
                    onClick={() => featuredImgInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
                <span className="text-[11px] text-[#9ca0a4]">Image from device or media library</span>
              </div>
            )}
            <input
              ref={featuredImgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "featuredImage"); }}
            />
            {form.featuredImage && (
              <input
                type="text"
                value={form.featuredImageAlt}
                onChange={(e) => set("featuredImageAlt", e.target.value)}
                placeholder="Alt text (for SEO)"
                className="mt-2 w-full px-3 py-1.5 text-[12px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
              />
            )}
          </div>

          {/* ── Video (mobile order 6) ── */}
          <div className="order-6 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1 space-y-4">
            <h3 className="text-[13px] font-semibold text-[#1d2327]">Video</h3>

            <div>
              <label className="block text-[12px] font-semibold text-[#646970] mb-2">Video File</label>
              {form.videoUrl ? (
                <div className="space-y-2">
                  <video
                    key={form.videoUrl}
                    src={form.videoUrl}
                    controls
                    className="w-full rounded border border-[#c3c4c7] bg-black"
                    style={{ maxHeight: 180 }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[12px] text-[#646970] flex-1">
                      {form.videoUrl.split("/").pop()?.split("?")[0] || form.videoUrl}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVideoModalOpen(true)}
                      className="text-[12px] text-[#2271b1] hover:underline shrink-0"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => set("videoUrl", "")}
                      className="text-[#646970] hover:text-red-500 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full border-2 border-dashed border-[#c3c4c7] rounded p-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setVideoModalOpen(true)}
                    className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50"
                  >
                    Select from Library
                  </button>
                  <span className="text-[11px] text-[#646970]">or</span>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "videoUrl"); }}
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#646970] mb-2">
                Video Thumbnail
              </label>
              {form.videoThumbnail ? (
                <div className="relative w-full h-28 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.videoThumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover rounded border border-[#c3c4c7]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setThumbModalOpen(true)}
                      className="text-white text-[11px] bg-black/60 rounded px-2 py-1 hover:bg-black/80"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => set("videoThumbnail", "")}
                      className="text-white bg-black/60 rounded p-0.5 hover:bg-black/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full border-2 border-dashed border-[#c3c4c7] rounded p-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setThumbModalOpen(true)}
                    className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50"
                  >
                    Select from Library
                  </button>
                  <span className="text-[11px] text-[#646970]">or</span>
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              )}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "videoThumbnail"); }}
              />
            </div>
          </div>

          {/* ── Author (mobile order 7) ── */}
          <div className="order-7 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1">
            <h3 className="text-[13px] font-semibold text-[#1d2327] mb-3">Author</h3>
            {(() => {
              const selectedAuthor =
                authors.find((a) => a.id === form.authorId) ??
                (initialData?.author as BlogAuthor | undefined | null) ??
                null;
              return selectedAuthor ? (
                <div className="flex items-center gap-2.5 mb-3 p-1 bg-[#f6f7f7] rounded border border-[#c3c4c7]">
                  {selectedAuthor.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedAuthor.image}
                      alt={selectedAuthor.name ?? ""}
                      className="w-8 h-8 rounded-full object-cover border border-[#c3c4c7] shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2271b1] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                      {(selectedAuthor.name ?? "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1d2327] truncate">
                      {selectedAuthor.name ?? "Unknown"}
                    </p>
                    <p className="text-[11px] text-[#646970] truncate">
                      {selectedAuthor.role?.replace("_", " ")}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}
            <select
              value={form.authorId}
              onChange={(e) => set("authorId", e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] bg-white"
            >
              <option value="">— Select Author —</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name ?? author.email} ({author.role.replace("_", " ")})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#646970] mt-1.5">
              Leave empty to use your own account as author.
            </p>
          </div>

          {/* ── Category (mobile order 8) ── */}
          <div className="order-8 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1">
            <h3 className="text-[13px] font-semibold text-[#1d2327] mb-3">Category</h3>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] bg-white"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Tags (mobile order 9) ── */}
          <div className="order-9 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1">
            <h3 className="text-[13px] font-semibold text-[#1d2327] mb-3">Tags</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                }}
                placeholder="tag1, tag2, tag3 (comma separated)"
                className="flex-1 px-3 py-1.5 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
              />
              <button
                onClick={addTag}
                className="px-3 py-1.5 text-[13px] bg-[#2271b1] text-white rounded hover:bg-[#135e96]"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(form.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0f0f1] text-[#646970] rounded text-[12px]"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 ml-0.5">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* ── Post Info — edit only (mobile order 10) ── */}
          {isEdit && (
            <div className="order-10 xl:order-none bg-white border-0 xl:rounded xl:border xl:border-[#c3c4c7] p-1">
              <h3 className="text-[13px] font-semibold text-[#1d2327] mb-2">Post Info</h3>
              <div className="space-y-1 text-[12px] text-[#646970]">
                <p>
                  Views:{" "}
                  <span className="font-semibold text-[#1d2327]">{initialData?.viewCount ?? 0}</span>
                </p>
                <p>
                  Status:{" "}
                  <span className="font-semibold text-[#1d2327]">{form.status}</span>
                </p>
                <p>
                  Words:{" "}
                  <span className="font-semibold text-[#1d2327]">{wordCount.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Media Picker Modals ─── */}
      <MediaPickerModal
        open={featuredImgModalOpen}
        onClose={() => setFeaturedImgModalOpen(false)}
        onSelect={(items: PickedMedia[]) => {
          if (!items.length) return;
          set("featuredImage", items[0].url);
          if (items[0].altText) set("featuredImageAlt", items[0].altText);
          setFeaturedImgModalOpen(false);
        }}
        title="Select Featured Image"
        source={MediaSource.BLOG}
      />

      <MediaPickerModal
        open={ogImgModalOpen}
        onClose={() => setOgImgModalOpen(false)}
        onSelect={(items: PickedMedia[]) => {
          if (!items.length) return;
          set("ogImage", items[0].url);
          setOgImgModalOpen(false);
        }}
        title="Select OG Image"
        source={MediaSource.BLOG}
      />

      <MediaPickerModal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        onSelect={(items: PickedMedia[]) => {
          if (!items.length) return;
          set("videoUrl", items[0].url);
          setVideoModalOpen(false);
        }}
        title="Select Video"
        source={MediaSource.BLOG}
      />

      <MediaPickerModal
        open={thumbModalOpen}
        onClose={() => setThumbModalOpen(false)}
        onSelect={(items: PickedMedia[]) => {
          if (!items.length) return;
          set("videoThumbnail", items[0].url);
          setThumbModalOpen(false);
        }}
        title="Select Thumbnail Image"
        source={MediaSource.BLOG}
      />
    </div>
  );
}
