//app/(backend)/admin/warranty-claims/[id]/SubmitStatusButton.tsx

'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitStatusButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-[#f6f7f7] border border-[#2271b1] text-[#2271b1] px-4 py-1.5 text-[13px] font-semibold rounded hover:bg-[#f0f0f1] transition-colors cursor-pointer w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
    >
      {pending ? (
        <><svg className="animate-spin h-3.5 w-3.5 text-[#2271b1]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Updating...</>
      ) : 'Update Status'}
    </button>
  );
}