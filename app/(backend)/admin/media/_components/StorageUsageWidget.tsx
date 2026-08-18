// app/(backend)/admin/media/_components/StorageUsageWidget.tsx

import type { StorageUsage } from '@/app/actions/backend/media/media-action';

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
  return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
}

function barColor(percent: number) {
  if (percent >= 90) return 'bg-[#d63638]';
  if (percent >= 75) return 'bg-[#dba617]';
  return 'bg-[#00a32a]';
}

export default function StorageUsageWidget({ usage }: { usage: StorageUsage }) {
  const { cloudinary, vercelBlob } = usage;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      {/* Cloudinary */}
      <div className="bg-white border border-[#c3c4c7] rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-[#1d2327]">Cloudinary (video + warranty images)</span>
          <div className="flex items-center gap-2">
            {cloudinary && (
              <span className="text-[11px] px-1.5 py-0.5 bg-[#f0f0f1] rounded-sm uppercase tracking-wide text-[#646970]">{cloudinary.plan} plan</span>
            )}
            <a
              href="https://console.cloudinary.com/settings/billing/plan"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#2271b1] hover:underline whitespace-nowrap"
            >
              Manage / upgrade plan ↗
            </a>
          </div>
        </div>
        {cloudinary ? (
          <>
            <div className="flex items-center justify-between text-[12px] text-[#646970] mb-1">
              <span>Monthly credits</span>
              <span className="font-medium text-[#1d2327]">{cloudinary.creditsUsed.toFixed(1)} / {cloudinary.creditsLimit} ({cloudinary.usedPercent.toFixed(0)}%)</span>
            </div>
            <div className="w-full h-2 bg-[#f0f0f1] rounded-full overflow-hidden mb-2">
              <div className={`h-full ${barColor(cloudinary.usedPercent)}`} style={{ width: `${Math.min(cloudinary.usedPercent, 100)}%` }} />
            </div>
            {cloudinary.usedPercent >= 90 && (
              <p className="text-[11px] text-[#d63638] font-medium mb-2">⚠ Nearly at the free-plan monthly limit — new uploads may start failing.</p>
            )}
            <div className="flex gap-4 text-[11px] text-[#646970]">
              <span>Storage: <strong className="text-[#1d2327]">{formatBytes(cloudinary.storageBytes)}</strong></span>
              <span>Bandwidth: <strong className="text-[#1d2327]">{formatBytes(cloudinary.bandwidthBytes)}</strong></span>
            </div>
          </>
        ) : (
          <p className="text-[12px] text-[#646970]">Usage data unavailable right now.</p>
        )}
      </div>

      {/* Vercel Blob */}
      <div className="bg-white border border-[#c3c4c7] rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-[#1d2327]">Vercel Blob (everything else)</span>
          <span className="text-[11px] px-1.5 py-0.5 bg-[#f0f0f1] rounded-sm uppercase tracking-wide text-[#646970]">Pro plan</span>
        </div>
        {vercelBlob ? (
          <>
            <div className="text-[12px] text-[#646970] mb-1">
              Total used: <strong className="text-[#1d2327]">{formatBytes(vercelBlob.totalBytes)}</strong> across {vercelBlob.fileCount} files
            </div>
            <p className="text-[11px] text-[#8c8f94]">
              Plan quota isn&apos;t shown here — Vercel Blob&apos;s storage API doesn&apos;t expose it. Check{' '}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-[#2271b1] hover:underline">
                your Vercel dashboard
              </a>{' '}
              for the account-level limit.
            </p>
          </>
        ) : (
          <p className="text-[12px] text-[#646970]">Usage data unavailable right now.</p>
        )}
      </div>
    </div>
  );
}
