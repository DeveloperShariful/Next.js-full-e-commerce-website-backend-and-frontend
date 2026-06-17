//app/(frontend)/checkout/components/ShippingForm.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import type { CSSObject } from '@emotion/react';

// --- Interfaces ---
interface ShippingFormData {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  postcode: string;
  email: string;
  phone: string;
}

interface AddressOption {
  value: string;
  label: string;
  suburb: string;
  postcode: string;
  state: string;
}

interface ApiAddressItem {
  value: string;
  label: string;
  suburb: string;
  postcode: string;
  state: string;
}

interface ShippingFormProps {
  title: string;
  onAddressChange: (address: Partial<ShippingFormData>) => void;
  defaultValues?: Partial<ShippingFormData>;
  // ✅ FIX: sessionKey prop added to differentiate billing vs shipping form storage.
  // BUG WAS: Both forms used the same key 'checkoutShippingFormData', so when user
  // enabled "Ship to different address" and typed in shipping form, it overwrote
  // billing form data in sessionStorage. On page reload, billing form would load
  // shipping address data!
  sessionKey?: string;
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

const EMPTY_FORM: ShippingFormData = {
  firstName: '',
  lastName: '',
  address1: '',
  city: '',
  state: '',
  postcode: '',
  email: '',
  phone: '',
};

export default function ShippingForm({
  title,
  onAddressChange,
  defaultValues = {},
  sessionKey = 'checkout_billing_form', // ✅ Default key for billing form
}: ShippingFormProps) {

  const [formData, setFormData] = useState<ShippingFormData>(() => {
    // ✅ FIX: Uses `sessionKey` (prop) instead of hardcoded constant.
    // Billing form uses 'checkout_billing_form'.
    // Shipping form uses 'checkout_shipping_form' (passed from CheckoutClient).
    // No more cross-contamination between the two forms.
    try {
      if (typeof window !== 'undefined') {
        const savedData = sessionStorage.getItem(sessionKey);
        if (savedData) {
          return JSON.parse(savedData);
        }
      }
    } catch (error) {
      console.error("Could not load form data from session storage", error);
    }

    return { ...EMPTY_FORM, ...defaultValues };
  });

  useEffect(() => {
    onAddressChange(formData);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(sessionKey, JSON.stringify(formData));
      }
    } catch (error) {
      console.error("Could not save form data to session storage", error);
    }
  }, [formData, onAddressChange, sessionKey]);

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
      const response = await fetch(`/api/address-lookup?query=${encodeURIComponent(inputValue)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((item: ApiAddressItem) => ({ ...item, label: item.value }));
    } catch (error) {
      console.error('Address lookup failed:', error);
      return [];
    }
  }, []);

  const debouncedLoadOptions = useCallback(
    (inputValue: string, callback: (options: AddressOption[]) => void) => {
      loadAddressOptions(inputValue).then(options => callback(options));
    },
    [loadAddressOptions]
  );

  const labelClass = "block text-sm font-semibold mb-2 text-[#333]";
  const inputClass = "w-full h-[48px] px-3 border border-[#ddd] rounded-[5px] text-base transition-colors duration-200 focus:outline-none focus:border-[#007bff] focus:ring-[2px] focus:ring-[#007bff]/20 read-only:bg-[#f5f5f5] read-only:cursor-not-allowed read-only:text-[#555]";

  return (
    <div className="w-full flex flex-col gap-6">
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
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>First name *</label>
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Last name *</label>
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className={inputClass}
            required
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Street address *</label>
          <input
            name="address1"
            placeholder="House number and street name"
            value={formData.address1}
            onChange={handleInputChange}
            className={inputClass}
            required
          />
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
            value={
              formData.city
                ? {
                    label: `${formData.city}, ${formData.state} ${formData.postcode}`,
                    value: formData.city,
                    suburb: formData.city,
                    postcode: formData.postcode,
                    state: formData.state,
                  }
                : null
            }
            loadingMessage={() => 'Searching...'}
            noOptionsMessage={({ inputValue }) =>
              inputValue.length < 2
                ? 'Keep typing to see suggestions'
                : 'No results found'
            }
          />
        </div>

        <div>
          <label className={labelClass}>State *</label>
          <input
            name="state"
            value={formData.state}
            className={inputClass}
            required
            readOnly
            placeholder="Auto-filled"
          />
        </div>
        <div>
          <label className={labelClass}>Postcode *</label>
          <input
            name="postcode"
            value={formData.postcode}
            className={inputClass}
            required
            readOnly
            placeholder="Auto-filled"
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Phone *</label>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            className={inputClass}
            required
          />
        </div>
      </div>
    </div>
  );
}
