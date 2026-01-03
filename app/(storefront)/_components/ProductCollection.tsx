// File: app/(storefront)/_component/ProductCollection.tsx
import Image from 'next/image';
import Link from 'next/link';

const products = [
    { imgSrc: "https://gobikes.au/wp-content/uploads/2025/10/Electric-Balance-Bike-Electric-bike-Balance-Bike-Bike-baby-bike-E-bike-scaled.webp", altText: "GoBike 12 Kids Electric Balance Bike", name: "GoBike 12-inch", feature: "Perfect for Ages 2-5 | Featuring a Slow Safety Mode for new riders.", link: "product/ebike-for-kids-12-inch-electric-bike-ages-2-5" },
    { imgSrc: "https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-1-scaled-1.webp", altText: "GoBike 16 Kids Electric Bike", name: "GoBike 16-inch", feature: "Best for Ages 5-9 | With 3-Speed Modes, Dual Hydraulic Brakes and Front Suspension.", link: "product/ebike-for-sale-16-inch-gobike-ages-5-9" },
    { imgSrc: "https://gobikes.au/wp-content/uploads/2025/10/Electric-Balance-Bike-Electric-bike-Balance-Bike-Bike-baby-bike-1-1-scaled-2-scaled.webp", altText: "GoBike 20 All-Terrain Kids Electric Bike", name: "GoBike 20-inch", feature: "Serious Bike for Ages 9-16 | A powerful and reliable bike for the bigger kids.", link: "product/20-inch-electric-bikes-for-sale-ebike-for-kids" }
];

const ProductCollection = () => {
  return (
    <section className="py-5 font-sans">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-5">The GoBike Electric Bike Latest Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Link href={product.link} className="group text-center border border-gray-200 rounded-lg overflow-hidden flex flex-col justify-between hover:-translate-y-2 hover:shadow-lg transition-all duration-300" key={index}>
              <div className="bg-gray-100 p-1.5">
                <Image 
                  loading="lazy" 
                  src={product.imgSrc} 
                  alt={product.altText} 
                  width={2560} height={1850} 
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="w-full h-auto aspect-square object-cover rounded"
                />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 m-0">{product.name}</h3>
                <p className="text-[17px] font-semibold text-black my-4 flex-grow">{product.feature}</p>
                <span className="inline-block bg-black text-white py-3 px-5 rounded font-semibold transition-colors duration-300 group-hover:bg-gray-800">View Details</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/bikes" className="inline-block bg-black text-white px-9 py-3.5 rounded-full font-bold text-base border-2 border-transparent transition-all duration-300 hover:bg-white hover:text-black hover:border-black">View All Bikes</Link>
        </div>
      </div>
    </section>
  );
}

export default ProductCollection;