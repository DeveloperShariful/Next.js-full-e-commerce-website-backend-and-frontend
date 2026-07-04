"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateBlogSettings, type BlogSettingsFormData } from "@/app/actions/backend/blog/blog-settings-actions";

const SHARE_PLATFORMS = [
  { id: "facebook",  label: "Facebook" },
  { id: "twitter",   label: "Twitter / X" },
  { id: "linkedin",  label: "LinkedIn" },
  { id: "whatsapp",  label: "WhatsApp" },
  { id: "copy",      label: "Copy Link" },
];

interface Props {
  initialData: BlogSettingsFormData & { sharePlatforms?: string[]; defaultKeyTakeaways?: string[] } | null;
}

export function BlogSettingsForm({ initialData }: Props) {
  const [form, setForm] = useState({
    blogTitle:           initialData?.blogTitle           ?? "GoBike Blog",
    blogDescription:     initialData?.blogDescription     ?? "",
    heroImage:           initialData?.heroImage           ?? "",
    postsPerPage:        initialData?.postsPerPage        ?? 12,
    commentsEnabled:     initialData?.commentsEnabled     ?? true,
    commentModeration:   initialData?.commentModeration   ?? true,
    shareEnabled:        initialData?.shareEnabled        ?? true,
    sharePlatforms:      initialData?.sharePlatforms      ?? ["facebook", "twitter", "linkedin", "whatsapp", "copy"],
    defaultKeyTakeaways: (initialData?.defaultKeyTakeaways ?? []).join("\n"),
    defaultAuthorBio:    initialData?.defaultAuthorBio    ?? "",
  });

  const [saving, setSaving] = useState(false);

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const togglePlatform = (id: string) => {
    const current = form.sharePlatforms;
    set("sharePlatforms", current.includes(id) ? current.filter((p) => p !== id) : [...current, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    const data: BlogSettingsFormData = {
      ...form,
      postsPerPage: Number(form.postsPerPage),
      defaultKeyTakeaways: form.defaultKeyTakeaways
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
    };
    const res = await updateBlogSettings(data);
    setSaving(false);
    if (res.success) toast.success("Settings saved!");
    else toast.error(res.error || "Failed to save");
  };

  return (
    <div className="space-y-5">

      {/* General */}
      <section className="bg-white rounded border border-[#c3c4c7] p-5">
        <h2 className="text-[14px] font-semibold text-[#1d2327] mb-4 pb-2 border-b border-[#f0f0f1]">
          General
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1d2327] mb-1.5">Blog Title</label>
            <input
              type="text"
              value={form.blogTitle}
              onChange={(e) => set("blogTitle", e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1d2327] mb-1.5">Blog Description</label>
            <textarea
              value={form.blogDescription}
              onChange={(e) => set("blogDescription", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-none"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1d2327] mb-1.5">Hero Banner Image URL</label>
            <input
              type="url"
              value={form.heroImage}
              onChange={(e) => set("heroImage", e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
            />
            {form.heroImage && (
              <img src={form.heroImage} alt="Hero preview" className="mt-2 h-24 rounded object-cover w-full" />
            )}
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1d2327] mb-1.5">Posts Per Page</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.postsPerPage}
              onChange={(e) => set("postsPerPage", e.target.value)}
              className="w-32 px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
            />
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="bg-white rounded border border-[#c3c4c7] p-5">
        <h2 className="text-[14px] font-semibold text-[#1d2327] mb-4 pb-2 border-b border-[#f0f0f1]">
          Comments
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.commentsEnabled}
              onChange={(e) => set("commentsEnabled", e.target.checked)}
              className="w-4 h-4"
            />
            <div>
              <p className="text-[13px] font-semibold text-[#1d2327]">Enable Comments</p>
              <p className="text-[11px] text-[#646970]">Allow readers to leave comments on blog posts</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.commentModeration}
              onChange={(e) => set("commentModeration", e.target.checked)}
              className="w-4 h-4"
              disabled={!form.commentsEnabled}
            />
            <div>
              <p className={`text-[13px] font-semibold ${!form.commentsEnabled ? "text-gray-400" : "text-[#1d2327]"}`}>
                Require Admin Approval
              </p>
              <p className="text-[11px] text-[#646970]">Comments will be reviewed before appearing publicly</p>
            </div>
          </label>
        </div>
      </section>

      {/* Social Sharing */}
      <section className="bg-white rounded border border-[#c3c4c7] p-5">
        <h2 className="text-[14px] font-semibold text-[#1d2327] mb-4 pb-2 border-b border-[#f0f0f1]">
          Social Sharing
        </h2>
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={form.shareEnabled}
            onChange={(e) => set("shareEnabled", e.target.checked)}
            className="w-4 h-4"
          />
          <p className="text-[13px] font-semibold text-[#1d2327]">Enable Share Buttons</p>
        </label>
        {form.shareEnabled && (
          <div className="flex flex-wrap gap-2">
            {SHARE_PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlatform(p.id)}
                className={`px-3 py-1.5 rounded text-[12px] font-semibold border transition-colors ${
                  form.sharePlatforms.includes(p.id)
                    ? "bg-[#2271b1] text-white border-[#2271b1]"
                    : "bg-white text-[#646970] border-[#c3c4c7] hover:border-[#2271b1]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Default Key Takeaways */}
      <section className="bg-white rounded border border-[#c3c4c7] p-5">
        <h2 className="text-[14px] font-semibold text-[#1d2327] mb-1">Default Key Takeaways</h2>
        <p className="text-[12px] text-[#646970] mb-3">
          Shown on posts that don&apos;t have their own takeaways. One takeaway per line.
        </p>
        <textarea
          value={form.defaultKeyTakeaways}
          onChange={(e) => set("defaultKeyTakeaways", e.target.value)}
          rows={6}
          placeholder={"Point 1\nPoint 2\nPoint 3"}
          className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-y font-mono"
        />
        <p className="text-[11px] text-[#646970] mt-1">
          {form.defaultKeyTakeaways.split("\n").filter((l) => l.trim()).length} takeaways
        </p>
      </section>

      {/* Default Author Bio */}
      <section className="bg-white rounded border border-[#c3c4c7] p-5">
        <h2 className="text-[14px] font-semibold text-[#1d2327] mb-1">Default Author Bio</h2>
        <p className="text-[12px] text-[#646970] mb-3">
          Shown on posts where the author doesn&apos;t have a custom bio set.
        </p>
        <textarea
          value={form.defaultAuthorBio}
          onChange={(e) => set("defaultAuthorBio", e.target.value)}
          rows={3}
          placeholder="Australia's leading provider of premium electric balance bikes..."
          className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] resize-none"
        />
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#2271b1] text-white text-[13px] font-semibold rounded hover:bg-[#135e96] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
