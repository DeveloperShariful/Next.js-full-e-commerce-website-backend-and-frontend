// File: app/(storefront)/_component/FaqSection.tsx
import Link from 'next/link';

const faqs = [
    { question: "Are electric bikes safe for young children?", answer: "Absolutely! Our entire range of <strong>electric bikes for kids</strong> is designed with safety as the number one priority. They feature parental speed controls, sturdy yet lightweight frames, and reliable braking systems, making them the <strong>Perfect bike for toddlers</strong> and young kids to build confidence and master their balance safely." },
    { question: "How do I choose the best kids electric bike?", answer: "Finding the <strong>best kids electric bike</strong> comes down to your child's age, size, and confidence level. Key things to look for are the correct size (e.g., 12\" or 16\" wheels), adjustable speed settings, and great battery life. Our collection ticks all these boxes, making the choice simple for Aussie parents." },
    { question: "What's the difference between a kids e-bike and a kids motorbike?", answer: "While both offer powered fun, a <strong>kids ebike</strong> is essentially an electric-powered balance bike designed for learning. It's light and easy to handle. A traditional petrol <strong>Kids Motorbike</strong> is often heavier and more complex. Our e-bikes deliver the \"motorbike\" thrill with the safety and simplicity young riders need." },
    { question: "What age are these childrens electric bikes for?", answer: "Our <strong>childrens electric bikes</strong> cater for a wide age range, typically from toddlers as young as 2 up to 16 years old. The adjustable speed settings make this possible. It's the kind of versatile <strong>electric bike</strong> that truly grows with your child." },
    { question: "What's the speed and battery life like on an ebike for kids?", answer: "An <strong>ebike for kids</strong> is designed for safe fun, not racing. Most models feature two speed modes: a slow learning mode (around 8-10 km/h) and a faster mode (up to 18 km/h). The high-quality battery is built to last for hours of riding on a single charge." }
];

const FaqSection = () => {
  return (
    <section className="py-12 px-2.5 font-sans">
      <div className="max-w-[1500px] mx-auto px-2.5">
        <h2 className="text-center text-3xl font-semibold text-gray-900 mb-9 font-poppins">Got Questions About Kids e-Bikes? We Have the Answers.</h2>
        <p className="text-center text-[17px] text-gray-600 max-w-2xl mx-auto -mt-4 mb-10 leading-relaxed font-inter">Got questions about the <strong>best kids electric bike</strong>? We have answered the most common ones below to help you choose the perfect GoBike for your child in Australia.</p>
        
        {faqs.map((faq, index) => (
          <details className="group bg-white mb-4 rounded-xl shadow-sm border border-gray-200 transition-shadow duration-300 hover:shadow-md" key={index}>
            <summary className="w-full p-6 bg-transparent border-0 text-left font-poppins text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center list-none group-open:text-blue-700">
              <span>{faq.question}</span>
              <span className="text-xl font-bold text-blue-500 transition-transform duration-300 group-open:rotate-90">&gt;</span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 text-base leading-relaxed">
              <p dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
            </div>
          </details>
        ))}
        
        <div className="text-center mt-10">
          <Link href="/faq" className="inline-block bg-black text-white px-8 py-3.5 rounded-full font-medium text-base font-poppins transition-all duration-300 hover:text-white hover:-translate-y-1">View All FAQs</Link>
        </div>
      </div>
    </section>
  );
}

export default FaqSection;