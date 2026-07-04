"use client";

import { useEffect } from "react";
import { incrementBlogPostView } from "@/app/actions/backend/blog/blog-actions";

export function BlogViewCounter({ postId }: { postId: string }) {
  useEffect(() => {
    incrementBlogPostView(postId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
