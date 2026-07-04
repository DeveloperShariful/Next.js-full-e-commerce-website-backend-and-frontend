import { getBlogSettings } from "@/app/actions/backend/blog/blog-settings-actions";
import { BlogSettingsForm } from "./_components/blog-settings-form";

export default async function BlogSettingsPage() {
  const { data: settings } = await getBlogSettings();
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Blog Settings</h1>
        <p className="text-[13px] text-[#646970] mt-1">
          Global settings applied to all blog pages and posts.
        </p>
      </div>
      <BlogSettingsForm initialData={settings ? {
        ...settings,
        blogDescription: settings.blogDescription ?? undefined,
        heroImage: settings.heroImage ?? undefined,
        defaultAuthorBio: settings.defaultAuthorBio ?? undefined,
      } : null} />
    </div>
  );
}
