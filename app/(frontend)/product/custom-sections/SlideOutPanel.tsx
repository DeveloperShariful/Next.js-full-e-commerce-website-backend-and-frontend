// ফাইল পাথ: app/product/custom-sections/SlideOutPanel.tsx

'use client';


interface SlideOutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function SlideOutPanel({ isOpen, onClose, title, children }: SlideOutPanelProps) {

  return (
    <>
      <div 
        className={`fixed top-0 left-0 w-full h-full bg-black/50 z-[999] transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} 
        onClick={onClose} 
      />
      <div 
        className={`fixed top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.1)] z-[1000] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-5 border-b border-[#e5e5e5]">
          <h3 className="text-[1.1rem] font-semibold m-0 tracking-[1px] uppercase">{title}</h3>
          <button 
            onClick={onClose} 
            className="bg-transparent border-none cursor-pointer p-0 text-[2rem] text-[#333] leading-none hover:text-black transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
            {children}
        </div>
      </div>
    </>
  );
}