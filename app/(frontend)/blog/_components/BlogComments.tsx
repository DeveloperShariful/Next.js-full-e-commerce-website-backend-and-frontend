"use client";

import { useState } from "react";
import { submitComment } from "@/app/actions/backend/blog/blog-comment-actions";

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  replies: {
    id: string;
    authorName: string;
    content: string;
    createdAt: Date;
  }[];
}

interface Props {
  postId: string;
  comments: Comment[];
  commentsEnabled: boolean;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  compact = false,
}: {
  postId: string;
  parentId?: string;
  onSuccess: (msg: string) => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [fields, setFields] = useState({ name: "", email: "", url: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await submitComment({
      postId,
      parentId,
      authorName: fields.name,
      authorEmail: fields.email,
      authorUrl: fields.url || undefined,
      content: fields.content,
    });
    setSubmitting(false);
    if (res.success) {
      setFields({ name: "", email: "", url: "", content: "" });
      onSuccess(res.message ?? "Comment submitted!");
    } else {
      setError(res.error ?? "Failed to submit");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-3" : ""}>
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fields.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={fields.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="your@email.com (not published)"
              className="w-full px-4 py-2.5 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>
      )}
      {compact && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            required
            value={fields.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name *"
            className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-black"
          />
          <input
            type="email"
            required
            value={fields.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="Email *"
            className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-black"
          />
        </div>
      )}
      <textarea
        required
        value={fields.content}
        onChange={(e) => set("content", e.target.value)}
        placeholder={compact ? "Write your reply..." : "Share your thoughts..."}
        rows={compact ? 3 : 5}
        className="w-full px-4 py-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-black resize-none transition-colors mb-3"
      />
      {error && <p className="text-red-500 text-[13px] mb-3">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-black text-white text-[13px] font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {submitting ? "Submitting..." : compact ? "Post Reply" : "Post Comment"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-[13px] text-gray-600 hover:text-black border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function BlogComments({ postId, comments, commentsEnabled }: Props) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setReplyingTo(null);
    setTimeout(() => setSuccessMsg(""), 8000);
  };

  return (
    <section className="mt-16 pt-12 border-t border-gray-200">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-8">
        {comments.length > 0
          ? `${comments.length} Comment${comments.length > 1 ? "s" : ""}`
          : "Leave a Comment"}
      </h2>

      {/* Success message */}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-[14px] font-medium">
          ✓ {successMsg}
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-8 mb-12">
          {comments.map((comment) => (
            <div key={comment.id}>
              {/* Comment */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0">
                  {getInitials(comment.authorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <p className="font-bold text-gray-900 text-[15px]">{comment.authorName}</p>
                      <time className="text-[12px] text-gray-400">{formatDate(comment.createdAt)}</time>
                    </div>
                    <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>
                  </div>
                  {commentsEnabled && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="mt-2 ml-2 text-[12px] font-semibold text-gray-500 hover:text-black transition-colors"
                    >
                      {replyingTo === comment.id ? "Cancel Reply" : "↩ Reply"}
                    </button>
                  )}

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 ml-2 pl-4 border-l-2 border-gray-200">
                      <CommentForm
                        postId={postId}
                        parentId={comment.id}
                        onSuccess={handleSuccess}
                        onCancel={() => setReplyingTo(null)}
                        compact
                      />
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-4 ml-2 pl-4 border-l-2 border-gray-100 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                            {getInitials(reply.authorName)}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                                <p className="font-bold text-gray-900 text-[13px]">{reply.authorName}</p>
                                <time className="text-[11px] text-gray-400">{formatDate(reply.createdAt)}</time>
                              </div>
                              <p className="text-gray-700 text-[14px] leading-relaxed whitespace-pre-line">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Comment Form */}
      {commentsEnabled ? (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {comments.length > 0 ? "Join the Discussion" : "Be the First to Comment"}
          </h3>
          <CommentForm postId={postId} onSuccess={handleSuccess} />
          <p className="text-[12px] text-gray-400 mt-4">
            Your email address will not be published. Comments may be moderated before appearing.
          </p>
        </div>
      ) : (
        <p className="text-gray-500 text-[14px] italic">Comments are closed for this post.</p>
      )}
    </section>
  );
}
