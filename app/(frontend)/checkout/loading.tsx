// app/(frontend)/checkout/loading.tsx

export default function CheckoutLoading() {
  return (
    <div className="w-full px-4 md:px-8 py-8 bg-[#f8f9fa] min-h-[80vh]">
      <div className="max-w-7xl mx-auto">

        {/* Page title skeleton */}
        <div className="h-8 w-48 bg-gray-200 rounded-lg mb-8 animate-pulse" />

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Left: Billing / Shipping Form ── */}
          <div className="flex-1 space-y-5">

            {/* Contact block */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
              </div>
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
              </div>
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>

            {/* Shipping block */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3 animate-pulse">
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-16 bg-gray-100 rounded-xl" />
              <div className="h-16 bg-gray-100 rounded-xl" />
            </div>

            {/* Payment block */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3 animate-pulse">
              <div className="h-5 w-36 bg-gray-200 rounded" />
              <div className="flex gap-3">
                <div className="h-16 flex-1 bg-gray-100 rounded-xl" />
                <div className="h-16 flex-1 bg-gray-100 rounded-xl" />
              </div>
              <div className="h-14 bg-gray-100 rounded-xl" />
              <div className="h-14 bg-gray-200 rounded-xl mt-2" />
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 rounded" />

              {/* Cart items */}
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                  <div className="h-4 w-16 bg-gray-100 rounded shrink-0" />
                </div>
              ))}

              {/* Coupon */}
              <div className="flex gap-2 pt-1">
                <div className="h-10 flex-1 bg-gray-100 rounded-lg" />
                <div className="h-10 w-20 bg-gray-200 rounded-lg" />
              </div>

              {/* Totals */}
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                {["Subtotal", "Shipping", "Tax"].map(label => (
                  <div key={label} className="flex justify-between items-center">
                    <div className="h-4 w-20 bg-gray-100 rounded" />
                    <div className="h-4 w-16 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <div className="h-6 w-12 bg-gray-200 rounded" />
                <div className="h-6 w-24 bg-gray-200 rounded" />
              </div>

              {/* Place order button */}
              <div className="h-14 bg-gray-200 rounded-xl mt-2" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
