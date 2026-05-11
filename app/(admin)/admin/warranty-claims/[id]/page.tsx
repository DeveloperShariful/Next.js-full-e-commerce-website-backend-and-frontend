//app/(backend)/admin/warranty-claims/[id]/page.tsx

// app/(backend)/admin/warranty-claims/[id]/page.tsx

import { db } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { updateClaimStatus } from '@/app/actions/admin/warranty/claim-action';
import TransdirectClientBox from './TransdirectClientBox';
import SubmitStatusButton from './SubmitStatusButton';

export const dynamic = 'force-dynamic';

export default async function SingleClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const claim = await db.warrantyClaim.findUnique({
    where: { id },
  });

  if (!claim) notFound();

  const cleanOrderNumber = claim.orderNumber.replace('#', '').trim();

  // ১. Prisma দিয়ে সরাসরি ডাটাবেজ থেকে স্পেয়ার পার্টস আনা (No Apollo/GraphQL needed)
  let spareParts: any[] = [];
  try {
    const sparePartsData = await db.product.findMany({
      where: {
        category: { slug: 'spare-parts' }, // Assuming category slug is 'spare-parts'
        status: 'ACTIVE'
      },
      select: {
        id: true,
        productCode: true,
        name: true,
        weight: true,
        length: true,
        width: true,
        height: true,
        featuredImage: true,
      },
      take: 50
    });

    // Mapping to match the expected format for TransdirectClientBox
    spareParts = sparePartsData.map(part => ({
      id: part.id,
      databaseId: part.productCode,
      name: part.name,
      weight: part.weight ? Number(part.weight) : 0.5,
      length: part.length ? Number(part.length) : null,
      width: part.width ? Number(part.width) : null,
      height: part.height ? Number(part.height) : null,
      image: part.featuredImage ? { sourceUrl: part.featuredImage } : undefined
    }));
  } catch (error) {
    console.error("Failed to fetch spare parts from database", error);
  }

  // ২. Prisma Order থেকে অর্ডারের ফুল ডিটেইলস আনা (No WooCommerce REST API needed)
  let localOrder: any = null;
  let billingDetails: any = {};
  let shippingDetails: any = {};

  try {
    const orderRecord = await db.order.findUnique({
      where: { orderNumber: cleanOrderNumber },
      include: { items: true }
    });

    if (orderRecord) {
      localOrder = orderRecord;
      // Prisma JSON fields parse
      billingDetails = typeof orderRecord.billingAddress === 'string' ? JSON.parse(orderRecord.billingAddress) : orderRecord.billingAddress || {};
      shippingDetails = typeof orderRecord.shippingAddress === 'string' ? JSON.parse(orderRecord.shippingAddress) : orderRecord.shippingAddress || {};
    }
  } catch (error) {
    console.error("Database query error for order:", error);
  }

  const isVideo = claim.mediaUrl?.match(/\.(mp4|mov|webm|m4v)$/i);
  const emailMismatch = localOrder && billingDetails?.email && claim.email.toLowerCase() !== billingDetails.email.toLowerCase();

  return (
    <div className="w-full pb-10">
      
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Edit Warranty Claim</h1>
        <Link href="/admin/warranty-claims" className="border border-[#2271b1] text-[#2271b1] px-3 py-1 text-[13px] rounded hover:bg-[#2271b1] hover:text-white transition-colors">
          ← Back to Claims
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-sm">
            <h2 className="px-4 py-3 border-b border-[#c3c4c7] text-[13px] sm:text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7] flex justify-between items-center">
              <span>Submitted Claim Details</span>
              <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] sm:text-[12px]">Order #{claim.orderNumber}</span>
            </h2>
            
            <div className="p-4 text-[13px] text-[#3c434a] flex flex-col sm:grid sm:grid-cols-2 gap-4 sm:gap-6">
              
              <div className="w-full">
                <p className="text-[#8c8f94] mb-1 font-medium">Name Provided</p>
                <p className="font-semibold text-[#1d2327] break-words">{claim.name}</p>
              </div>
              
              <div className="w-full">
                <p className="text-[#8c8f94] mb-1 font-medium">Email Provided</p>
                <div className={`font-semibold flex flex-wrap items-center gap-2 ${emailMismatch ? 'text-orange-600' : 'text-[#2271b1]'}`}>
                  <a href={`mailto:${claim.email}`} className="break-all">{claim.email}</a>
                  {emailMismatch && (
                    <span className="bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0.5 rounded border border-orange-200 whitespace-nowrap" title="Doesn't match Database Order">
                      Mismatch
                    </span>
                  )}
                </div>
              </div>
              
              <div className="sm:col-span-2 w-full mt-2 sm:mt-0">
                <p className="text-[#8c8f94] mb-1 font-medium">Issue Description</p>
                <p className="leading-relaxed whitespace-pre-wrap p-3 bg-gray-50 border border-gray-200 rounded text-[13px] text-[#3c434a]">
                  {claim.description}
                </p>
              </div>

            </div>
          </div>

          <div className="bg-white border border-[#c3c4c7] shadow-sm">
            <h2 className="px-4 py-3 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7] flex justify-between items-center">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.97-1.3-3.15-3.61-3.15-2.31 0-3.83 1.25-3.83 3.03 0 1.8 1.4 2.87 3.53 3.32 1.91.41 2.34 1.15 2.34 1.87 0 .53-.39 1.5-2.19 1.5-1.77 0-2.36-.93-2.43-1.84h-1.73c.09 1.93 1.44 3.23 4.14 3.23 2.25 0 3.93-1.18 3.93-3.11-.01-1.83-1.41-2.91-3.56-3.39z"/></svg>
                Original Order Info
              </span>
              {localOrder ? (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[11px] font-bold tracking-widest uppercase">{localOrder.status}</span>
              ) : (
                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[11px] font-bold">NOT FOUND IN DATABASE</span>
              )}
            </h2>
            
            {localOrder ? (
              <div className="p-0">
                <div className="border-b border-[#f0f0f1]">
                  <table className="w-full text-left text-[13px] text-[#3c434a]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 font-semibold">Product Bought</th>
                        <th className="py-2 px-4 font-semibold text-center">Qty</th>
                        <th className="py-2 px-4 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {localOrder.items?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 text-[#2271b1] font-semibold">{item.productName}</td>
                          <td className="py-2 px-4 text-center">x{item.quantity}</td>
                          <td className="py-2 px-4 text-right">${Number(item.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#f0f0f1]">
                  <div className="p-4 text-[13px]">
                    <h3 className="font-bold text-gray-500 uppercase tracking-wider text-[11px] mb-3">Billing Details</h3>
                    <p className="font-semibold text-[#1d2327] mb-1">{billingDetails.firstName} {billingDetails.lastName}</p>
                    <p className="text-[#2271b1] mb-1"><a href={`mailto:${billingDetails.email}`}>{billingDetails.email}</a></p>
                    <p className="text-[#50575e] mb-2">{billingDetails.phone}</p>
                    <p className="text-[#50575e]">
                      {billingDetails.address1} {billingDetails.address2}<br/>
                      {billingDetails.city}, {billingDetails.state} {billingDetails.postcode}
                    </p>
                  </div>
                  
                  <div className="p-4 text-[13px]">
                    <h3 className="font-bold text-gray-500 uppercase tracking-wider text-[11px] mb-3">Shipping Details</h3>
                    <p className="font-semibold text-[#1d2327] mb-1">{shippingDetails.firstName} {shippingDetails.lastName}</p>
                    <p className="text-[#50575e]">
                      {shippingDetails.address1} {shippingDetails.address2}<br/>
                      {shippingDetails.city}, {shippingDetails.state} {shippingDetails.postcode}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 text-[13px]">
                We couldn't find an order with number <strong>#{claim.orderNumber}</strong> in the database. The customer might have entered it wrong.
              </div>
            )}
          </div>

          <div className="bg-white border border-[#c3c4c7] shadow-sm">
            <h2 className="px-4 py-3 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7]">
              Customer Uploaded Media
            </h2>
            <div className="p-4 bg-gray-50 flex flex-col items-center gap-6">
              {claim.mediaUrl ? (
                claim.mediaUrl.split(',').map((url, index) => {
                  const cleanUrl = url.trim();
                  const isVid = cleanUrl.match(/\.(mp4|mov|webm|m4v)$/i);
                  return (
                    <div key={index} className="w-full flex flex-col items-center border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                      {isVid ? (
                        <>
                          <video src={cleanUrl} controls playsInline preload="metadata" className="w-full max-h-[500px] border border-gray-300 rounded shadow-sm bg-black">
                            <source src={cleanUrl} type="video/mp4" />
                            <source src={cleanUrl} type="video/quicktime" />
                            Your browser does not support the video tag.
                          </video>
                          <a href={cleanUrl} target="_blank" className="mt-3 text-[#2271b1] text-[13px] hover:underline flex items-center gap-1 font-semibold">
                            <span>🔗</span> Open / Download Original Video {index + 1}
                          </a>
                        </>
                      ) : (
                        <>
                          <img src={cleanUrl} alt={`Claim Media ${index + 1}`} className="max-w-full max-h-[500px] border border-gray-300 rounded shadow-sm" />
                          <a href={cleanUrl} target="_blank" className="mt-3 text-[#2271b1] text-[13px] hover:underline flex items-center gap-1 font-semibold">
                            <span>🔗</span> Open Full Image {index + 1}
                          </a>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 italic py-10">No media attached.</p>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ACTIONS --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#c3c4c7] shadow-sm">
            <h2 className="px-4 py-3 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7]">Claim Status</h2>
            <div className="p-4 text-[13px]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#8c8f94] font-semibold">Current Status:</span>
                {claim.status === 'PENDING' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">Pending</span>}
                {claim.status === 'APPROVED' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Approved</span>}
                {claim.status === 'REJECTED' && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold">Rejected</span>}
                {claim.status === 'TRASHED' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">Trashed</span>}
              </div>
              <form action={updateClaimStatus} className="border-t border-[#f0f0f1] pt-4 mt-2">
                <input type="hidden" name="id" value={claim.id} />
                <label className="block text-[13px] font-semibold text-[#3c434a] mb-2">Change Status Manually:</label>
                <select name="status" defaultValue={claim.status} className="w-full border border-[#8c8f94] rounded text-[13px] px-3 py-2 outline-none focus:border-[#2271b1] mb-4">
                  <option value="PENDING">Pending (Review Needed)</option>
                  <option value="APPROVED">Approve Claim</option>
                  <option value="REJECTED">Reject Claim</option>
                </select>
                <div className="flex justify-end">
                  <SubmitStatusButton />
                </div>
              </form>
            </div>
          </div>

          <TransdirectClientBox 
            claimId={claim.id} 
            status={claim.status} 
            trackingNumber={claim.trackingNumber} 
            replacementPart={claim.replacementPart} 
            spareParts={spareParts} 
            customerAddress={shippingDetails?.address1 || claim.address}
            customerSuburb={shippingDetails?.city || claim.suburb}
            customerPostcode={shippingDetails?.postcode || claim.postcode}
            customerState={shippingDetails?.state || claim.state}
          />
        </div>
      </div>
    </div>
  );
}