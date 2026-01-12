//app/(storefront)/checkout/_components/ShippingForm.tsx

'use client';

import { useState, useEffect, useCallback } from 'react'; 
import AsyncSelect from 'react-select/async';
import type { CSSObject } from '@emotion/react';
import { useGlobalStore } from '@/app/providers/global-store-provider'; // 👈 Import Provider

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
    '&:hover': { borderColor: '#aaa' },
  }),
};

const FORM_DATA_SESSION_KEY = 'checkoutShippingFormData';

export default function ShippingForm({ title, onAddressChange, defaultValues = {} }: ShippingFormProps) {
  
  // 1. Global Store থেকে ডাটা নিন
  const { address: storeAddress, primaryColor } = useGlobalStore(); 
  
  // স্টোরের কান্ট্রি ডিফল্ট হিসেবে ব্যবহার হবে
  const defaultCountry = storeAddress.country || "Australia"; 

  const [formData, setFormData] = useState<ShippingFormData>(() => {
    if (typeof window !== 'undefined') {
        try {
            const savedData = sessionStorage.getItem(FORM_DATA_SESSION_KEY);
            if (savedData) return JSON.parse(savedData);
        } catch (error) { console.error(error); }
    }
    return {
      firstName: '', lastName: '', address1: '', city: '',
      state: '', postcode: '', email: '', phone: '',
      ...defaultValues,
    };
  });

  // Debounce Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        onAddressChange(formData);
        if (typeof window !== 'undefined') sessionStorage.setItem(FORM_DATA_SESSION_KEY, JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timer);
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

  const loadAddressOptions = useCallback(async (inputValue: string): Promise<AddressOption[]> => {
    if (inputValue.trim().length < 1) return [];
    try {
      const response = await fetch(`/api/address-lookup?query=${inputValue}`);
      if(!response.ok) return [];
      const data = await response.json();
      return data.map((item: ApiAddressItem) => ({ ...item, label: item.value }));
    } catch (error) { return []; }
  }, []);

  const labelClass = "block text-sm font-semibold mb-2 text-[#333]";
  const inputClass = "w-full h-[48px] px-3 border border-[#ddd] rounded-[5px] text-base transition-colors duration-200 focus:outline-none focus:ring-[2px] focus:ring-opacity-20";

  // Dynamic Style for Focus
  const focusStyle = {
      borderColor: primaryColor,
      '--tw-ring-color': primaryColor // Tailwind ring color override variable logic needed or styled component
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-full h-96 bg-gray-50 animate-pulse rounded-lg"></div>;

  return (
    <div className="w-full flex flex-col gap-6">
      <h2 className="text-[1.4rem] font-extrabold text-center md:text-[1.75rem] md:font-bold md:text-left m-0 border-b border-[#e0e0e0] pb-3 md:pb-4">
        {title}
      </h2>
      
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <label className={labelClass}>Country / Region *</label>
          {/* Dynamic Country */}
          <input type="text" value={defaultCountry} readOnly className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500`} />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Email address *</label>
          <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={inputClass} style={{accentColor: primaryColor}} required />
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
            cacheOptions defaultOptions
            placeholder="Start typing Suburb or Postcode..."
            loadOptions={loadAddressOptions}
            onChange={handleSelectChange}
            styles={selectStyles}
            value={formData.city ? { label: `${formData.city}, ${formData.state} ${formData.postcode}`, value: formData.city, suburb: formData.city, postcode: formData.postcode, state: formData.state } : null}
          />
        </div>

        <div>
          <label className={labelClass}>State *</label>
          <input name="state" value={formData.state} onChange={handleInputChange} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Postcode *</label>
          <input name="postcode" value={formData.postcode} onChange={handleInputChange} className={inputClass} required />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Phone *</label>
          <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className={inputClass} required />
        </div>
      </div>
    </div>
  );
}