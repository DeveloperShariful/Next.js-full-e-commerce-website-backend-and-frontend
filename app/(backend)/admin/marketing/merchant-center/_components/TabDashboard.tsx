//File Path: app/(backend)/admin/marketing/merchant-center/_components/TabDashboard.tsx

"use client";

interface Props {
  config: any;
  totalStoreViews: number;
  syncedCount: number;
  failedCount: number;
}

export default function TabDashboard({ config, totalStoreViews, syncedCount, failedCount }: Props) {
  // ডাইনামিক ডেট রেঞ্জ (আজকের মাস)
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="max-w-[1200px] mx-auto mt-2">
      
      {/* Dynamic Alert based on real database conditions */}
      {failedCount > 0 ? (
        <div className="bg-[#fcf0f1] border border-[#d63638] border-l-4 p-4 mb-6 rounded-[3px] shadow-sm flex items-start gap-4">
          <div className="text-[#d63638] mt-1 font-bold">!</div>
          <div>
            <p className="text-[14px] text-[#1d2327] m-0 mb-1 leading-relaxed">
              <strong>Action Required:</strong> You have {failedCount} products that failed to sync with Google Merchant Center. Fix them to increase your visibility.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#f0f6ea] border border-[#00a32a] border-l-4 p-4 mb-6 rounded-[3px] shadow-sm flex items-start gap-4">
          <div className="text-[#00a32a] mt-1 font-bold">✓</div>
          <div>
            <p className="text-[14px] text-[#1d2327] m-0 leading-relaxed">
              All {syncedCount} products are perfectly synced with Google! Connect Google Ads to start running campaigns.
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Date Filter */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <label className="block text-[12px] text-[#646970] mb-1">Date range:</label>
          <select className="border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[14px] bg-white min-w-[300px]">
            <option>Month to date ({currentMonth} 1 - {new Date().getDate()}, {currentYear})</option>
            <option>Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Google Ads Setup Card */}
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden">
          <h2 className="text-[18px] font-normal text-[#1d2327] border-b border-[#ccd0d4] px-6 py-4 m-0">
            Google Ads
          </h2>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              
              <div className="w-[180px] h-[220px] bg-[#f0f0f1] border border-[#ccd0d4] rounded-[5px] flex-shrink-0 relative overflow-hidden">
                <div className="h-[20px] bg-[#e0e0e0] w-[80%] mx-auto mt-2 rounded-full"></div>
                <div className="h-[120px] bg-[#d0d0d0] mt-3 flex items-center justify-center text-[40px]">📍</div>
                <div className="p-2">
                  <span className="bg-[#fbbc05] text-white text-[10px] px-1 font-bold rounded-sm">Ad</span>
                  <p className="text-[10px] mt-1 font-bold text-[#1d2327]">{config.gmcMerchantName || "Your Store Name"}</p>
                </div>
              </div>

              <ul className="list-none p-0 m-0 text-[13px] text-[#50575e] leading-relaxed flex flex-col gap-3">
                <li className="flex gap-2"><span className="text-[#00a32a]">✓</span> Advertise {syncedCount} synced products across Google Search and YouTube.</li>
                <li className="flex gap-2"><span className="text-[#00a32a]">✓</span> Set a daily budget and only pay for clicks.</li>
                <li className="flex gap-2"><span className="text-[#00a32a]">✓</span> Performance Max uses Google's AI to show the most impactful ads.</li>
              </ul>
            </div>

            <div className="text-right border-t border-[#ccd0d4] pt-4">
              {config.googleAdsConnected ? (
                <a 
                  href={`https://ads.google.com/aw/campaigns/new?ocid={config.googleAdsAccountId}`} 
                  target="_blank"
                  className="inline-block bg-[#2271b1] text-white px-5 py-2 rounded-[3px] text-[13px] font-semibold hover:bg-[#135e96]"
                >
                  Manage Campaigns ↗
                </a>
              ) : (
                <a 
                  href="/admin/marketing/merchant-center?tab=settings" 
                  className="inline-block bg-[#2271b1] text-white px-5 py-2 rounded-[3px] text-[13px] font-semibold hover:bg-[#135e96]"
                >
                  Connect Google Ads
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 100% DYNAMIC REAL DATA */}
        <div className="bg-white border border-[#ccd0d4] rounded-[3px] h-fit">
          <h2 className="text-[16px] font-normal text-[#1d2327] border-b border-[#ccd0d4] px-6 py-4 m-0 flex justify-between">
            <span>Store Performance Overview</span>
            {config.googleAdsConnected && <span className="text-[11px] bg-[#e6f4ea] text-[#137333] px-2 py-1 rounded">Ads Connected</span>}
          </h2>
          
          <div className="flex divide-x divide-[#ccd0d4] border-b border-[#ccd0d4]">
            {/* Dynamic Store Views */}
            <div className="flex-1 p-6">
              <p className="text-[12px] text-[#646970] m-0 mb-1">Total Store Views</p>
              <div className="flex items-end gap-3">
                <span className="text-[28px] font-normal text-[#1d2327]">{totalStoreViews.toLocaleString()}</span>
                {totalStoreViews > 0 && <span className="bg-[#e6f4ea] text-[#137333] text-[11px] font-bold px-1.5 py-0.5 rounded-[3px] mb-2">Active ↑</span>}
              </div>
            </div>
            
            {/* Dynamic Sync Status */}
            <div className="flex-1 p-6">
              <p className="text-[12px] text-[#646970] m-0 mb-1">Live in Google</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[28px] font-normal text-[#2271b1]">{syncedCount}</span>
                <span className="text-[#646970] text-[11px] font-bold">Products</span>
              </div>
            </div>
          </div>

          <div className="p-4 text-center bg-[#f9f9f9]">
            <p className="text-[12px] text-[#646970] m-0">
              {config.googleAdsConnected 
                ? "Your Google Ads account is connected. Campaign metrics will sync here shortly." 
                : "Connect your Google Ads account in Settings to view Clicks and Spend data."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}