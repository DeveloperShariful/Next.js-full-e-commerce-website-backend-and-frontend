// app/(admin)/admin/users/[id]/UserFormClient.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Role } from '@prisma/client';
import { State } from 'country-state-city';
// 🛑 FIXED: Corrected MediaPicker import path based on your folder structure
import { MediaPicker } from '@/components/media/media-picker'; 

import { createUser, updateUser } from '@/app/actions/admin/users/user-actions';

export default function UserFormClient({ initialData, countries }: { initialData: any, countries: any[] }) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);

  // WordPress Style Password Generator State
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  
  // App Password State
  const [appName, setAppName] = useState('');

  // Billing Address State
  const [billing, setBilling] = useState({
    firstName: initialData?.billingAddress?.firstName || '',
    lastName: initialData?.billingAddress?.lastName || '',
    company: initialData?.billingAddress?.company || '',
    address1: initialData?.billingAddress?.address1 || '',
    address2: initialData?.billingAddress?.address2 || '',
    city: initialData?.billingAddress?.city || '',
    postcode: initialData?.billingAddress?.postcode || '',
    country: initialData?.billingAddress?.country || 'AU', 
    state: initialData?.billingAddress?.state || '',
    phone: initialData?.billingAddress?.phone || '',
    email: initialData?.billingAddress?.email || initialData?.email || '',
  });

  // Shipping Address State
  const [shipping, setShipping] = useState({
    firstName: initialData?.shippingAddress?.firstName || '',
    lastName: initialData?.shippingAddress?.lastName || '',
    company: initialData?.shippingAddress?.company || '',
    address1: initialData?.shippingAddress?.address1 || '',
    address2: initialData?.shippingAddress?.address2 || '',
    city: initialData?.shippingAddress?.city || '',
    postcode: initialData?.shippingAddress?.postcode || '',
    country: initialData?.shippingAddress?.country || 'AU', 
    state: initialData?.shippingAddress?.state || '',
    phone: initialData?.shippingAddress?.phone || '',
  });

  // Dynamic States fetching
  const billingStates = State.getStatesOfCountry(billing.country);
  const shippingStates = State.getStatesOfCountry(shipping.country);

  // 🛑 FIXED: Stripping the prefix to match state keys so typing works
  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name.replace('billing_', ''); // Example: 'billing_firstName' -> 'firstName'
    setBilling(prev => ({ ...prev, [key]: value }));
    if (key === 'country') setBilling(prev => ({ ...prev, state: '' }));
  };

  // 🛑 FIXED: Stripping the prefix to match state keys
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name.replace('shipping_', '');
    setShipping(prev => ({ ...prev, [key]: value }));
    if (key === 'country') setShipping(prev => ({ ...prev, state: '' }));
  };

  const copyBillingToShipping = () => {
    setShipping({
      firstName: billing.firstName,
      lastName: billing.lastName,
      company: billing.company,
      address1: billing.address1,
      address2: billing.address2,
      city: billing.city,
      postcode: billing.postcode,
      country: billing.country,
      state: billing.state,
      phone: billing.phone,
    });
    toast.success('Billing address copied to shipping.');
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    setShowPasswordInput(true);
  };

  // Media Picker Handlers
  const [profileImage, setProfileImage] = useState<string>(initialData?.image || '');
  const handleImageChange = (url: string) => setProfileImage(url);
  const handleImageRemove = () => setProfileImage('');

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (isEditing) {
      formData.append('id', initialData.id);
    }

    if (!showPasswordInput) {
        formData.set('password', '');
    }

    formData.append('image', profileImage);

    try {
      const res = isEditing ? await updateUser(formData) : await createUser(formData);
      
      if (res.success) {
        toast.success(res.message);
        if (!isEditing) {
          router.push('/admin/users'); 
        } else {
          router.refresh(); 
        }
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  // WooCommerce Standard Classes
  const headingClass = "text-[18px] font-semibold text-[#1d2327] mb-2 pt-6 border-t border-[#c3c4c7] first:border-0 first:pt-0";
  const descClass = "block text-[#646970] text-[13px] font-normal mt-1";
  const tableClass = "w-full text-left text-[14px] text-[#3c434a] mb-8 block lg:table";
  const thClass = "py-[15px] lg:py-[20px] pr-[20px] font-semibold w-full lg:w-[250px] align-top text-left text-[#1d2327] text-[14px] block lg:table-cell";
  const tdClass = "py-[10px] lg:py-[15px] px-[10px] align-top text-[#3c434a] block lg:table-cell";
  const inputClass = "w-full max-w-[400px] border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] outline-none transition-shadow bg-white";
  const selectClass = "w-full max-w-[400px] border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] outline-none transition-shadow bg-white";
  const textareaClass = "w-full max-w-[500px] border border-[#8c8f94] rounded-[3px] px-3 py-2 text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] outline-none transition-shadow bg-white resize-y";
  const btnClass = "bg-[#2271b1] border border-[#2271b1] text-white px-4 py-[5px] text-[13px] font-semibold rounded-[3px] shadow-[0_1px_0_#2271b1] hover:bg-[#135e96] focus:outline-none transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto";
  const secondaryBtnClass = "bg-[#f6f7f7] border border-[#2271b1] text-[#2271b1] px-3 py-1 text-[13px] font-semibold rounded-[3px] hover:bg-[#f0f0f1] transition-colors cursor-pointer w-fit";
  const actionBtnClass = "bg-[#f6f7f7] border border-[#8c8f94] text-[#3c434a] px-3 py-1 text-[13px] font-semibold rounded-[3px] hover:bg-[#f0f0f1] transition-colors cursor-pointer shadow-[0_1px_0_#c3c4c7] w-fit";

  return (
    <form onSubmit={handleSave} className="pb-10 max-w-full overflow-hidden">
      
      {/* 1. Name Section */}
      <h2 className={headingClass}>Name</h2>
      <table className={tableClass}>
        <tbody className="block lg:table-row-group">
          
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Username</th>
            <td className={tdClass}>
              <input 
                type="text" 
                disabled 
                value={initialData?.email || 'Will be generated from email'} 
                className={`${inputClass} bg-gray-100 cursor-not-allowed`} 
              />
              <span className={descClass}>Usernames cannot be changed.</span>
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Role</th>
            <td className={tdClass}>
              <select name="role" defaultValue={initialData?.role || 'CUSTOMER'} className={selectClass}>
                <option value="SUBSCRIBER">Subscriber</option>
                <option value="CUSTOMER">Customer</option>
                <option value="AFFILIATE">Affiliate</option>
                <option value="SUPPORT">Support</option>
                <option value="EDITOR">Editor</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Administrator</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
              </select>
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>First Name</th>
            <td className={tdClass}>
              <input name="firstName" defaultValue={initialData?.metafields?.firstName || ''} className={inputClass} />
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Last Name</th>
            <td className={tdClass}>
              <input name="lastName" defaultValue={initialData?.metafields?.lastName || ''} className={inputClass} />
            </td>
          </tr>
          
          <tr className="border-b border-[#c3c4c7] lg:border-transparent block lg:table-row">
            <th className={thClass}>Nickname <span className="text-[#d63638]">*</span></th>
            <td className={tdClass}>
              <input name="nickname" required defaultValue={initialData?.metafields?.nickname || initialData?.name || ''} className={inputClass} />
            </td>
          </tr>

        </tbody>
      </table>

      {/* 2. Contact Info */}
      <h2 className={headingClass}>Contact Info</h2>
      <table className={tableClass}>
        <tbody className="block lg:table-row-group">
          
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Email <span className="text-[#d63638]">*</span></th>
            <td className={tdClass}>
              <input name="email" type="email" required defaultValue={initialData?.email || ''} className={inputClass} />
            </td>
          </tr>
          
          <tr className="border-b border-[#c3c4c7] lg:border-transparent block lg:table-row">
            <th className={thClass}>Website</th>
            <td className={tdClass}>
              <input name="website" type="url" defaultValue={initialData?.metafields?.website || ''} className={inputClass} />
            </td>
          </tr>

        </tbody>
      </table>

      {/* 3. About the user */}
      <h2 className={headingClass}>About the user</h2>
      <table className={tableClass}>
        <tbody className="block lg:table-row-group">
          
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Biographical Info</th>
            <td className={tdClass}>
              <textarea name="bio" rows={5} defaultValue={initialData?.notes || ''} className={textareaClass}></textarea>
              <span className={descClass}>Share a little biographical information to fill out your profile. This may be shown publicly.</span>
            </td>
          </tr>
          
          <tr className="border-b border-[#c3c4c7] lg:border-transparent block lg:table-row">
            <th className={thClass}>Profile Picture</th>
            <td className={tdClass}>
              <div className="max-w-[150px]">
                  <MediaPicker 
                    label="" 
                    value={profileImage} 
                    onChange={handleImageChange} 
                    onRemove={handleImageRemove} 
                  />
              </div>
            </td>
          </tr>

        </tbody>
      </table>

      {/* 4. Account Management */}
      <h2 className={headingClass}>Account Management</h2>
      <table className={tableClass}>
        <tbody className="block lg:table-row-group">
          
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>New Password</th>
            <td className={tdClass}>
              {!showPasswordInput ? (
                <button type="button" onClick={generatePassword} className={secondaryBtnClass}>
                  Set New Password
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input 
                      name="password" 
                      type="text" 
                      defaultValue={generatedPassword} 
                      className={`${inputClass} !w-full sm:!w-[280px] font-mono`} 
                    />
                    <button type="button" onClick={() => setShowPasswordInput(false)} className={actionBtnClass}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </td>
          </tr>

          {isEditing && (
            <tr className="border-b border-[#c3c4c7] lg:border-transparent block lg:table-row">
              <th className={thClass}>Password Reset</th>
              <td className={tdClass}>
                <button type="button" className={secondaryBtnClass}>
                  Send Reset Link
                </button>
                <span className={descClass}>
                  Send a link to reset their password. This will not change their password, nor will it force a change.
                </span>
              </td>
            </tr>
          )}

        </tbody>
      </table>

      {/* 5. Application Passwords (UI Only for visual clone) */}
      <h2 className={headingClass}>Application Passwords</h2>
      <div className="mb-8">
        <p className={descClass + " mb-4"}>
          Application passwords allow authentication via non-interactive systems, such as XML-RPC or the REST API, without providing your actual password. Application passwords can be easily revoked. They cannot be used for traditional logins to your website.
        </p>
        <table className={tableClass}>
            <tbody className="block lg:table-row-group">
            <tr className="block lg:table-row">
                <th className={thClass}>New Application Password Name</th>
                <td className={tdClass}>
                <input type="text" value={appName} onChange={(e)=>setAppName(e.target.value)} className={inputClass} />
                <span className={descClass + " mb-3"}>Required to create an Application Password, but not to update the user.</span>
                <button type="button" disabled={!appName} className={secondaryBtnClass + " disabled:opacity-50"}>Add Application Password</button>
                </td>
            </tr>
            </tbody>
        </table>
      </div>

      {/* 6. Customer Billing Address */}
      <h2 className={headingClass}>Customer billing address</h2>
      <table className={tableClass}>
        <tbody className="block lg:table-row-group">
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>First name</th>
            <td className={tdClass}><input name="billing_firstName" value={billing.firstName} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Last name</th>
            <td className={tdClass}><input name="billing_lastName" value={billing.lastName} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Company</th>
            <td className={tdClass}><input name="billing_company" value={billing.company} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Address line 1</th>
            <td className={tdClass}><input name="billing_address1" value={billing.address1} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Address line 2</th>
            <td className={tdClass}><input name="billing_address2" value={billing.address2} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>City</th>
            <td className={tdClass}><input name="billing_city" value={billing.city} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Postcode / ZIP</th>
            <td className={tdClass}><input name="billing_postcode" value={billing.postcode} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
          
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Country / Region</th>
            <td className={tdClass}>
              <select name="billing_country" value={billing.country} onChange={handleBillingChange} className={selectClass}>
                <option value="">Select a country / region…</option>
                {countries?.map((c: any) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>State / County</th>
            <td className={tdClass}>
              {billingStates.length > 0 ? (
                <select name="billing_state" value={billing.state} onChange={handleBillingChange} className={selectClass}>
                  <option value="">Select an option…</option>
                  {billingStates.map((s: any) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input name="billing_state" value={billing.state} onChange={handleBillingChange} placeholder="State / County or state code" className={inputClass} />
              )}
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Phone</th>
            <td className={tdClass}><input name="billing_phone" value={billing.phone} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-transparent block lg:table-row">
            <th className={thClass}>Email address</th>
            <td className={tdClass}><input name="billing_email" type="email" value={billing.email} onChange={handleBillingChange} className={inputClass} /></td>
          </tr>
        </tbody>
      </table>

      {/* 7. Customer Shipping Address */}
      <h2 className={headingClass}>Customer shipping address</h2>
      <table className={tableClass}>
        <tbody className="block lg:table-row-group">
          
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Copy from billing address</th>
            <td className={tdClass}>
              <button type="button" onClick={copyBillingToShipping} className={actionBtnClass}>Copy</button>
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>First name</th>
            <td className={tdClass}><input name="shipping_firstName" value={shipping.firstName} onChange={handleShippingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Last name</th>
            <td className={tdClass}><input name="shipping_lastName" value={shipping.lastName} onChange={handleShippingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Company</th>
            <td className={tdClass}><input name="shipping_company" value={shipping.company} onChange={handleShippingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Address line 1</th>
            <td className={tdClass}><input name="shipping_address1" value={shipping.address1} onChange={handleShippingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Address line 2</th>
            <td className={tdClass}><input name="shipping_address2" value={shipping.address2} onChange={handleShippingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>City</th>
            <td className={tdClass}><input name="shipping_city" value={shipping.city} onChange={handleShippingChange} className={inputClass} /></td>
          </tr>
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Postcode / ZIP</th>
            <td className={tdClass}><input name="shipping_postcode" value={shipping.postcode} onChange={handleShippingChange} className={inputClass} /></td>
          </tr>
          
          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>Country / Region</th>
            <td className={tdClass}>
              <select name="shipping_country" value={shipping.country} onChange={handleShippingChange} className={selectClass}>
                <option value="">Select a country / region…</option>
                {countries?.map((c: any) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] lg:border-[#f0f0f1] block lg:table-row">
            <th className={thClass}>State / County</th>
            <td className={tdClass}>
              {shippingStates.length > 0 ? (
                <select name="shipping_state" value={shipping.state} onChange={handleShippingChange} className={selectClass}>
                  <option value="">Select an option…</option>
                  {shippingStates.map((s: any) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input name="shipping_state" value={shipping.state} onChange={handleShippingChange} placeholder="State / County or state code" className={inputClass} />
              )}
            </td>
          </tr>

          <tr className="border-b border-[#c3c4c7] lg:border-transparent block lg:table-row">
            <th className={thClass}>Phone</th>
            <td className={tdClass}><input name="shipping_phone" value={shipping.phone} onChange={handleShippingChange} className={inputClass} /></td>
          </tr>
        </tbody>
      </table>

      <div className="mt-8 pt-6 border-t border-[#c3c4c7]">
        <button type="submit" disabled={loading} className={btnClass}>
          {loading ? 'Saving...' : isEditing ? 'Update User' : 'Add New User'}
        </button>
      </div>

    </form>
  );
}