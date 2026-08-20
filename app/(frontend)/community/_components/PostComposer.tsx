"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import { uploadToCloudinaryOrFallback } from "@/lib/upload-media";
import { createCommunityPost, searchUsersForMention } from "@/app/actions/frontend/community/community-actions";
import { Avatar, type CommunityPostData } from "./PostCard";

const FB_BLUE = "#1877F2";
const MAX_FILES = 10;

interface PendingFile {
  file: File;
  previewUrl: string;
  mediaType: "IMAGE" | "VIDEO";
}

interface MentionCandidate {
  id: string;
  name: string | null;
  image: string | null;
}

export default function PostComposer({ onPosted }: { onPosted: (post: CommunityPostData) => void }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @mention autocomplete
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionCandidate[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<Record<string, string>>({}); // name -> userId

  const isLoggedIn = !!session?.user;

  useEffect(() => {
    if (mentionQuery === null) { setMentionResults([]); return; }
    const t = setTimeout(() => {
      searchUsersForMention(mentionQuery).then(res => { if (res.success) setMentionResults(res.users); });
    }, 200);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  const resetComposer = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setCaption("");
    setTagInput("");
    setFiles([]);
    setMentionedUsers({});
    setMentionQuery(null);
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const room = MAX_FILES - files.length;
    if (room <= 0) { toast.error(`You can attach up to ${MAX_FILES} files.`); return; }

    const newFiles: PendingFile[] = picked.slice(0, room).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      mediaType: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
    }));
    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCaption(value);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const pickMention = (user: MentionCandidate) => {
    if (!user.name) return;
    const cursor = textareaRef.current?.selectionStart ?? caption.length;
    const textBefore = caption.slice(0, cursor).replace(/@(\w*)$/, `@${user.name} `);
    const textAfter = caption.slice(cursor);
    setCaption(textBefore + textAfter);
    setMentionedUsers(prev => ({ ...prev, [user.name!]: user.id }));
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to post.");
      return;
    }
    if (!caption.trim() && files.length === 0) {
      toast.error("Add a photo, video, or caption first.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const uploadedMedia: { url: string; mediaType: "IMAGE" | "VIDEO" }[] = [];
      for (let i = 0; i < files.length; i++) {
        const pf = files[i];
        const uploaded = await uploadToCloudinaryOrFallback(pf.file, "community", (pct) => {
          setUploadProgress(Math.round(((i * 100) + pct) / files.length));
        });
        uploadedMedia.push({ url: uploaded.url, mediaType: pf.mediaType });
      }

      const tags = tagInput.split(",").map(t => t.trim()).filter(Boolean);
      const mentionedUserIds = Object.values(mentionedUsers);

      const res = await createCommunityPost({
        caption: caption.trim() || undefined,
        media: uploadedMedia,
        tags,
        mentionedUserIds,
      });

      if (res.success) {
        toast.success("Posted!");
        onPosted({
          id: res.postId!,
          slug: res.slug!,
          caption: caption.trim() || null,
          media: uploadedMedia.map((m, i) => ({ id: `temp-${i}`, url: m.url, mediaType: m.mediaType })),
          tags,
          reactionCount: 0,
          commentCount: 0,
          shareCount: 0,
          createdAt: new Date().toISOString(),
          author: {
            id: (session!.user as { id?: string }).id || "",
            name: session!.user!.name || null,
            image: session!.user!.image || null,
            role: ((session!.user as { role?: Role }).role || "CUSTOMER") as Role,
          },
          reactions: [],
          comments: [],
        });
        resetComposer();
      } else {
        toast.error(res.message || "Failed to post.");
      }
    } catch {
      toast.error("Something went wrong while posting.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <h2 className="text-[17px] font-bold text-[#050505] mb-2">Add a new post</h2>

      {/* Collapsed trigger bar — single row, matching Facebook's real layout */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DADDE1] p-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => isLoggedIn ? setOpen(true) : toast.error("Please sign in to post.")}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <Avatar name={session?.user?.name} image={session?.user?.image} size={40} />
            <span className="flex-1 text-left bg-[#F0F2F5] hover:bg-[#E4E6EB] transition-colors rounded-full px-4 py-2.5 text-[#65676B] text-[15px] truncate">
              What&apos;s on your mind, {session?.user?.name?.split(" ")[0] || "rider"}?
            </span>
          </button>
          <button
            onClick={() => isLoggedIn ? setOpen(true) : toast.error("Please sign in to post.")}
            title="Photo/Video"
            className="w-10 h-10 rounded-full hover:bg-[#F2F2F2] flex items-center justify-center shrink-0 transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-[#E7F3E8] flex items-center justify-center text-lg">📷</span>
          </button>
        </div>
      </div>

      {/* Modal composer */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={resetComposer}>
          <div
            className="bg-white rounded-lg w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center py-3 border-b border-[#DADDE1]">
              <h2 className="text-[19px] font-bold text-[#050505]">Create post</h2>
              <button
                onClick={resetComposer}
                disabled={isUploading}
                className="absolute right-3 w-8 h-8 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] flex items-center justify-center text-[#050505] disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Avatar name={session?.user?.name} image={session?.user?.image} />
                <p className="font-semibold text-[#050505] text-[15px]">{session?.user?.name}</p>
              </div>

              <div className="relative mb-3">
                <textarea
                  ref={textareaRef}
                  value={caption}
                  onChange={handleCaptionChange}
                  placeholder={`What's on your mind, ${session?.user?.name?.split(" ")[0] || "rider"}? Type @ to mention someone`}
                  rows={4}
                  className="w-full resize-none border-none outline-none text-[20px] placeholder:text-[#90949C]"
                  autoFocus
                />
                {mentionQuery !== null && mentionResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full bg-white border border-[#DADDE1] rounded-lg shadow-lg z-10 max-h-[200px] overflow-y-auto">
                    {mentionResults.map(u => (
                      <button
                        key={u.id}
                        onClick={() => pickMention(u)}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F2F2F2] text-left"
                      >
                        <Avatar name={u.name} image={u.image} size={28} />
                        <span className="text-[14px] font-medium text-[#050505]">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {files.length > 0 && (
                <div className={`grid gap-1.5 mb-3 ${files.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {files.map((f, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden bg-black">
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1.5 right-1.5 z-10 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/80 text-sm"
                      >
                        ✕
                      </button>
                      {f.mediaType === "VIDEO" ? (
                        <video src={f.previewUrl} className="w-full h-[160px] object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.previewUrl} alt="Preview" className="w-full h-[160px] object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Tags (comma separated, optional)"
                className="w-full border border-[#DADDE1] rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 mb-3"
                style={{ ["--tw-ring-color" as string]: FB_BLUE }}
              />

              {isUploading && (
                <div className="w-full bg-[#F0F2F5] rounded-full h-2 overflow-hidden mb-3">
                  <div className="h-full transition-all" style={{ width: `${uploadProgress}%`, backgroundColor: FB_BLUE }} />
                </div>
              )}

              <div className="flex items-center justify-between border border-[#DADDE1] rounded-lg px-3 py-2.5 mb-3">
                <span className="text-[15px] font-semibold text-[#050505]">
                  Add to your post {files.length > 0 && `(${files.length}/${MAX_FILES})`}
                </span>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" id="composer-modal-file-input" />
                <label htmlFor="composer-modal-file-input" className="w-9 h-9 rounded-full hover:bg-[#F2F2F2] flex items-center justify-center cursor-pointer text-xl">
                  📷
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isUploading || (!caption.trim() && files.length === 0)}
                className="w-full text-white text-[15px] font-bold py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: FB_BLUE }}
              >
                {isUploading ? `Posting ${uploadProgress}%` : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
