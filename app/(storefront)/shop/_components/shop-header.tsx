// File: app/(routes)/shop/_components/shop-header.tsx

export default function ShopHeader() {
  return (
    <div className="bg-slate-100 py-12 mb-8">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          Shop All Products
        </h1>
        <p className="text-slate-500">
          Explore the best collection tailored for you.
        </p>
      </div>
    </div>
  );
}