// app/checkout/_components/OrderNotes.tsx
'use client';

interface OrderNotesProps { notes: string; onNotesChange: (notes: string) => void; }

export default function OrderNotes({ notes, onNotesChange }: OrderNotesProps) {
  return (
    <div className="w-full mt-6">
      <label htmlFor="order_notes" className="block font-medium mb-2 text-[#333]">
        Order notes (optional)
      </label>
      <textarea
        id="order_notes"
        name="orderNotes"
        className="w-full p-[12px_15px] border border-[#ccc] rounded-[4px] text-sm md:text-base font-inherit leading-relaxed resize-y transition-colors duration-200 focus:outline-none focus:border-[#007bff] placeholder:text-gray-500"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Notes about your order, e.g. special notes for delivery."
        rows={4}
      />
    </div>
  );
}