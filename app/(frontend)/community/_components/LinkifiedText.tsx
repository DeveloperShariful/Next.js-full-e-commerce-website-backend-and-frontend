"use client";

import { Role } from "@prisma/client";

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER];

const GOBIKE_HOSTS = new Set(["gobike.au", "www.gobike.au"]);
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const FACEBOOK_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"]);

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function extractYouTubeId(url: URL): string | null {
  let raw: string | null = null;
  if (url.hostname === "youtu.be") {
    raw = url.pathname.slice(1);
  } else if (url.pathname === "/watch") {
    raw = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/shorts/")) {
    raw = url.pathname.split("/shorts/")[1];
  } else if (url.pathname.startsWith("/embed/")) {
    raw = url.pathname.split("/embed/")[1];
  }
  if (!raw) return null;
  raw = raw.split(/[?&/]/)[0];
  return /^[a-zA-Z0-9_-]{11}$/.test(raw) ? raw : null;
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black my-2" style={{ paddingTop: "56.25%" }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        loading="lazy"
        allow="clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

/**
 * Renders user-submitted text with URLs handled safely: gobike.au / YouTube / Facebook
 * links stay clickable (YouTube embeds inline in captions), everything else is plain,
 * unclickable text for non-staff authors — avoids the platform being used for backlink
 * spam while still letting people share a ride video.
 */
export default function LinkifiedText({
  text,
  authorRole,
  allowEmbed = false,
  suppressUrl,
}: {
  text: string;
  authorRole: Role;
  allowEmbed?: boolean;
  /** A URL already shown as its own preview card below — skip rendering it again inline. */
  suppressUrl?: string | null;
}) {
  const isStaff = STAFF_ROLES.includes(authorRole);
  const parts = text.split(URL_PATTERN);

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) {
          return part ? <span key={i}>{part}</span> : null;
        }
        if (suppressUrl && part === suppressUrl) return null;

        let url: URL;
        try {
          url = new URL(part);
        } catch {
          return <span key={i}>{part}</span>;
        }
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return <span key={i}>{part}</span>;
        }

        const host = url.hostname.toLowerCase();
        const isGoBike = GOBIKE_HOSTS.has(host) || host.endsWith(".gobike.au");
        const isYouTube = YOUTUBE_HOSTS.has(host);
        const isFacebook = FACEBOOK_HOSTS.has(host);

        if (allowEmbed && isYouTube) {
          const videoId = extractYouTubeId(url);
          if (videoId) return <YouTubeEmbed key={i} videoId={videoId} />;
        }

        if (isStaff || isGoBike || isYouTube || isFacebook) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel={isStaff ? "noopener noreferrer" : "noopener noreferrer ugc nofollow"}
              className="hover:underline break-words"
              style={{ color: "#1877F2" }}
            >
              {part}
            </a>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
