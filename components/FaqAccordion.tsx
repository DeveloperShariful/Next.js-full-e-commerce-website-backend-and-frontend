// components/FaqAccordion.tsx

export interface FaqAccordionItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({
  title,
  items,
}: {
  title: string;
  items: FaqAccordionItem[];
}) {
  return (
    <section className="bg-gray-50 rounded-xl p-3 md:p-5 mt-8">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="text-2xl text-center font-bold text-gray-900 mb-6">{title}</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <details
              key={item.question}
              className="group bg-white rounded-lg border border-gray-200 open:border-blue-200"
            >
              <summary className="w-full p-4 md:p-5 text-left text-base md:text-lg font-medium text-gray-800 cursor-pointer flex justify-between items-center gap-4 list-none [&::-webkit-details-marker]:hidden group-open:text-[#0056b3]">
                <span>{item.question}</span>
                <span className="text-lg font-bold text-[#007bff] transition-transform duration-300 group-open:rotate-90 shrink-0">
                  &gt;
                </span>
              </summary>
              <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-gray-600 leading-relaxed">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
