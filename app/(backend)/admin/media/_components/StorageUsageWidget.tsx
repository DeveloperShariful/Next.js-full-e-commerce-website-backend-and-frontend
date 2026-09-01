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
  const { cloudinaryAccounts, vercelBlob } = usage;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cloudinaryAccounts.map(acc => (
        <div key={acc.index} className="bg-white border border-[#c3c4c7] rounded-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#1d2327]">
              Cloudinary {acc.index + 1} <span className="text-[10px] px-1.5 py-0.5 bg-[#f0f0f1] rounded-sm uppercase tracking-wide text-[#646970] align-middle">{acc.plan}</span>
            </span>
          </div>
          <div className="text-[11px] text-[#8c8f94] mb-1 truncate" title={acc.cloudName}>{acc.cloudName}</div>
          <div className="flex items-center justify-between text-[12px] text-[#646970] mb-1">
            <span>Credits</span>
            <span className="font-medium text-[#1d2327]">{acc.creditsUsed.toFixed(1)} / {acc.creditsLimit} ({acc.usedPercent.toFixed(0)}%)</span>
          </div>
          <div className="w-full h-2 bg-[#f0f0f1] rounded-full overflow-hidden mb-2">
            <div className={`h-full ${barColor(acc.usedPercent)}`} style={{ width: `${Math.min(acc.usedPercent, 100)}%` }} />
          </div>
          {acc.usedPercent >= 90 && (
            <p className="text-[11px] text-[#d63638] font-medium mb-2">⚠ Nearly full — new uploads will move to the next account (if any).</p>
          )}
          <div className="flex flex-col gap-0.5 text-[11px] text-[#646970] mb-2">
            <span>Storage: <strong className="text-[#1d2327]">{formatBytes(acc.storageBytes)}</strong></span>
            <span>Bandwidth: <strong className="text-[#1d2327]">{formatBytes(acc.bandwidthBytes)}</strong></span>
          </div>
          <a
            href="https://console.cloudinary.com/settings/billing/plan"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-[#2271b1] hover:underline whitespace-nowrap"
            title={`This link opens the billing page of whichever Cloudinary account is currently logged in on this browser — make sure you're logged in as "${acc.cloudName}", otherwise it'll show the wrong account's billing.`}
          >
            Manage / upgrade plan ↗
          </a>
        </div>
      ))}

      {cloudinaryAccounts.length === 0 && (
        <div className="bg-white border border-[#c3c4c7] rounded-sm p-3 col-span-2 lg:col-span-3">
          <span className="text-[13px] font-semibold text-[#1d2327]">Cloudinary</span>
          <p className="text-[12px] text-[#646970] mt-2">Usage data unavailable right now.</p>
        </div>
      )}

      {/* Vercel Blob */}
      <div className="bg-white border border-[#c3c4c7] rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-[#1d2327]">Vercel Blob</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#f0f0f1] rounded-sm uppercase tracking-wide text-[#646970]">Pro plan</span>
        </div>
        <div className="text-[11px] text-[#8c8f94] mb-1">everything else</div>
        {vercelBlob ? (
          <>
            <div className="text-[12px] text-[#646970] mb-2">
              <strong className="text-[#1d2327]">{formatBytes(vercelBlob.totalBytes)}</strong> · {vercelBlob.fileCount} files
            </div>
            <p className="text-[11px] text-[#8c8f94]">
              Plan quota isn&apos;t shown here — Vercel Blob&apos;s storage API doesn&apos;t expose it. Check your{' '}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-[#2271b1] hover:underline">
                dashboard
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
