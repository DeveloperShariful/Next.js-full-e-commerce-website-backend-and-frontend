// File: app/(storefront)/_component/DifferenceSection.tsx
import Image from 'next/image';

const comparisonData = [
    { feature: "Long Run Time", isGoBike: true, isOthers: false }, { feature: "High Speed / Performance", isGoBike: true, isOthers: false }, { feature: "Slow Learning Mode", isGoBike: true, isOthers: false }, { feature: "Affordability", isGoBike: true, isOthers: false }, { feature: "Most Reliable", isGoBike: true, isOthers: false }, { feature: "Easy Spare Parts", isGoBike: true, isOthers: false }, { feature: "Best Support And Service", isGoBike: true, isOthers: false },
];

const TickMark = () => <span className="text-red-600 font-bold text-xl">✓</span>;
const CrossMark = () => <span className="text-black font-bold text-xl">✗</span>;

const DifferenceSection = () => {
  return (
    <section className="bg-black text-white py-12 px-2.5 font-sans">
      <div className="max-w-[1450px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div className="text-left">
            <h2 className="text-3xl font-bold text-white text-center mb-3">The GoBike Difference</h2>
            <h3 className="text-lg font-semibold text-white text-center mb-5">Engineered Better. Built Stronger.</h3>
            <p className="text-[17px] leading-relaxed mb-5">While others cut corners, we deliver what matters: the <strong>highest-performance and most reliable kids electric bike</strong> on the market, backed by a <strong>1-year advanced replacement warranty.</strong></p>
            <p className="text-[17px] leading-relaxed m-0">As a proud Aussie brand founded by two dads, we built the bikes we wanted for our own kids. That is the GoBike promise.</p>
          </div>
          
          <div>
            <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow-xl">
              <thead>
                <tr>
                  <th className="bg-transparent border-b border-gray-900 p-4"></th>
                  <th className="border-b border-gray-900 p-4 bg-white">
                    <div className="flex justify-center">
                        <Image src="https://res.cloudinary.com/dbij2wehz/image/upload/GOBIKE-Electric-Bike-for-kids.webp" width={1880} height={410} alt="GoBike Logo" className="max-h-10 w-auto" />
                    </div>
                  </th>
                  <th className="border-b border-gray-900 p-4 text-black text-base font-semibold">Others</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => (
                  <tr key={index}>
                    <td className="p-3 px-4 border-b border-gray-900 text-gray-900 text-left font-medium last:border-b-0">{item.feature}</td>
                    <td className="p-3 px-4 border-b border-gray-900 text-center bg-yellow-300 rounded-lg last:border-b-0">{item.isGoBike ? <TickMark /> : <CrossMark />}</td>
                    <td className="p-3 px-4 border-b border-gray-900 text-center last:border-b-0">{item.isOthers ? <TickMark /> : <CrossMark />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DifferenceSection;