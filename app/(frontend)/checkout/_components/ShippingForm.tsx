//app/(frontend)/checkout/_components/ShippingForm.tsx

'use client';

import { useState, useEffect, useCallback, useRef } from 'react'; 
import AsyncSelect from 'react-select/async';
import type { CSSObject } from '@emotion/react';

// --- Interfaces ---
interface ShippingFormData {
  firstName: string; lastName: string; address1: string; city: string;
  state: string; postcode: string; email: string; phone: string;
}

interface AddressOption {
  value: string; label: string; suburb: string; postcode: string; state: string;
}

interface ApiAddressItem {
  value: string; label: string; suburb: string; postcode: string; state: string;
}

interface ShippingFormProps {
  title: string;
  onAddressChange: (address: Partial<ShippingFormData>) => void;
  defaultValues?: Partial<ShippingFormData>;
}

const selectStyles = {
  control: (provided: CSSObject) => ({
    ...provided,
    minHeight: '48px',
    border: '1px solid #ddd',
    boxShadow: 'none',
    borderRadius: '5px',
    '&:hover': { borderColor: '#007bff' },
  }),
};

const FORM_DATA_SESSION_KEY = 'checkoutShippingFormData';

export default function ShippingForm({ title, onAddressChange, defaultValues = {} }: ShippingFormProps) {
  const isInitialized = useRef(false);

  // ১. সেশন স্টোরেজ এবং ডিফল্ট ভ্যালু মার্জ করা
  const [formData, setFormData] = useState<ShippingFormData>(() => {
    let savedData = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(FORM_DATA_SESSION_KEY);
        if (stored) savedData = JSON.parse(stored);
      } catch (error) {
        console.error("Could not load form data from session storage", error);
      }
    }
    
    return {
      firstName: '', lastName: '', address1: '', city: '',
      state: '', postcode: '', email: '', phone: '',
      ...savedData,
      ...defaultValues, // Server থেকে আসা ডিফল্ট ভ্যালুকে প্রায়োরিটি দেওয়া হলো
    };
  });

  // ২. শুধুমাত্র ডেটা চেঞ্জ হলেই Parent কে জানানো (Infinite Loop ঠেকানো)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      onAddressChange(formData);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      onAddressChange(formData);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(FORM_DATA_SESSION_KEY, JSON.stringify(formData));
      }
    }, 300); // 300ms Debounce

    return () => clearTimeout(timeoutId);
  }, [formData, onAddressChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption: AddressOption | null) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        city: selectedOption.suburb,
        postcode: selectedOption.postcode,
        state: selectedOption.state,
      }));
    }
  };

  // ৩. API কল (Transdirect Lookup)
  const loadAddressOptions = async (inputValue: string): Promise<AddressOption[]> => {
    if (inputValue.trim().length < 2) return []; // অন্তত ২ অক্ষর না লিখলে কল করবে না
    try {
      const response = await fetch(`/api/address-lookup?query=${inputValue}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.map((item: ApiAddressItem) => ({ ...item, label: item.value }));
    } catch (error) {
      return [];
    }
  };

  // ৪. রিয়েল টাইপ করার সময় API ওভারলোড ঠেকানো (Debouncing)
  const debouncedLoadOptions = useCallback(
    (inputValue: string, callback: (options: AddressOption[]) => void) => {
      // রিকোয়েস্ট কিছুটা ডিলে করে পাঠানো হচ্ছে যাতে প্রতি ক্লিকে API কল না যায়
      setTimeout(() => {
        loadAddressOptions(inputValue).then(callback);
      }, 500); 
    },
    []
  );

  const labelClass = "block text-sm font-semibold mb-2 text-[#333]";
  const inputClass = "w-full h-[48px] px-3 border border-[#ddd] rounded-[5px] text-base transition-colors duration-200 focus:outline-none focus:border-[#007bff] focus:ring-[2px] focus:ring-[#007bff]/20 read-only:bg-[#f5f5f5] read-only:cursor-not-allowed read-only:text-[#555]";

  return (
    <div className="w-full flex flex-col gap-6 bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-[1.4rem] font-extrabold text-center md:text-[1.75rem] md:font-bold md:text-left m-0 border-b border-[#e0e0e0] pb-3 md:pb-4">
        {title}
      </h2>
      
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <label className={labelClass}>Country / Region *</label>
          <input type="text" value="Australia" readOnly className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Email address *</label>
          <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={inputClass} required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>First name *</label>
          <input name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Last name *</label>
          <input name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClass} required />
        </div>
        
        <div className="col-span-2">
          <label className={labelClass}>Street address *</label>
          <input name="address1" placeholder="House number and street name" value={formData.address1} onChange={handleInputChange} className={inputClass} required />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Suburb / Postcode *</label>
          <AsyncSelect
            key={formData.city + formData.postcode}
            cacheOptions 
            defaultOptions
            placeholder="Start typing your Suburb or Postcode..."
            loadOptions={debouncedLoadOptions}
            onChange={handleSelectChange}
            styles={selectStyles}
            value={formData.city ? { label: `${formData.city}, ${formData.state} ${formData.postcode}`, value: formData.city, suburb: formData.city, postcode: formData.postcode, state: formData.state } : null}
            loadingMessage={() => 'Searching...'}
            noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Type at least 2 characters' : 'No results found'}
          />
        </div>

        <div>
          <label className={labelClass}>State *</label>
          <input name="state" value={formData.state} className={inputClass} required readOnly placeholder="Auto-filled" />
        </div>
        <div>
          <label className={labelClass}>Postcode *</label>
          <input name="postcode" value={formData.postcode} className={inputClass} required readOnly placeholder="Auto-filled" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Phone *</label>
          <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className={inputClass} required />
        </div>
      </div>
    </div>
  );
}