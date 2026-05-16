// components/TopBar.tsx
'use client'; 

export default function TopBar() {
  return (
    <>
      <style jsx global>{`
        @keyframes goldFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        @keyframes attentionPop {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 16, 39, 0.7); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(211, 16, 39, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 16, 39, 0); }
        }
      `}</style>

      <div 
        className="sticky top-0 z-50 text-[#C00000] p-[5px] md:p-[10px] text-center shadow-[0_4px_15px_rgba(255,215,0,0.6)] font-sans overflow-hidden border-b-2 border-white transition-all duration-300 flex items-center justify-center h-[55px] md:h-auto"
        style={{
          background: 'linear-gradient(90deg, #FFD700 0%, #FFEB3B 25%, #FDB931 50%, #FFEB3B 75%, #FFD700 100%)',
          backgroundSize: '300% 100%',
          animation: 'goldFlow 6s linear infinite',
        }}
      >
        <div className="flex justify-center items-center gap-[5px] md:gap-[30px] text-[10px] md:text-[14px] font-extrabold tracking-[0.5px] uppercase w-full md:w-auto px-[5px]">
          <span className="whitespace-normal md:whitespace-nowrap leading-[1.2] text-center flex-grow md:flex-grow-0"> 
            Same-day dispatch. Fast Australia-wide shipping.
            <span 
              className="inline-block bg-[#D31027] text-white px-[6px] py-[2px] md:px-[15px] md:py-[5px] rounded-[50px] mx-[3px] md:mx-[8px] font-black border-2 border-white shadow-md text-[9px] md:text-[14px]"
              style={{ animation: 'attentionPop 2s infinite' }}
            >
               ORDER NOW AND GET A FREE GOBIKE CREW TSHIRT
            </span>
          </span>
        </div>
      </div>
    </>
  );
}