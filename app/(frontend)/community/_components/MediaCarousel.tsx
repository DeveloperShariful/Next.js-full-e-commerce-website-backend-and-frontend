"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaType } from "@prisma/client";

interface MediaItem {
  id: string;
  url: string;
  mediaType: MediaType;
}

export default function MediaCarousel({ media, caption, priority }: { media: MediaItem[]; caption: string | null; priority?: boolean }) {
  const [index, setIndex] = useState(0);
  if (media.length === 0) return null;

  const current = media[index];
  const canPrev = index > 0;
  const canNext = index < media.length - 1;

  return (
    <div className="relative bg-black w-full">
      {current.mediaType === "VIDEO" ? (
        <div className="relative w-full max-h-[600px] aspect-square sm:aspect-video">
          <video
            key={current.id}
            src={current.url}
            poster={current.url.replace(/\.[a-zA-Z0-9]+$/, ".jpg")}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="relative w-full max-h-[600px] aspect-square sm:aspect-video">
          <Image src={current.url} alt={caption || "Community post"} fill unoptimized priority={priority} className="object-contain" />
        </div>
      )}

      {media.length > 1 && (
        <>
          {canPrev && (
            <button
              onClick={() => setIndex(i => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md text-lg"
            >
              ‹
            </button>
          )}
          {canNext && (
            <button
              onClick={() => setIndex(i => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md text-lg"
            >
              ›
            </button>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-1">
            {media.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
          <div className="absolute top-2 right-2 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            {index + 1}/{media.length}
          </div>
        </>
      )}
    </div>
  );
}
