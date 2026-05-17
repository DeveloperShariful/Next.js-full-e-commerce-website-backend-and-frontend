//app/(frontend)/warranty/WarrantyClient.tsx

// app/warranty/WarrantyClient.tsx

'use client';

import { useState, useRef } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { submitWarrantyClaim } from '@/app/actions/frontend/warranty/warranty-action';

export default function WarrantyClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]); 
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    orderNumber: '',
    shopPurchased: 'GoBike Australia', 
    email: '',
    description: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- UPDATED LOGIC: Vercel Blob বাদ দিয়ে Cloudinary REST API ব্যবহার করা হয়েছে ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); 
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');
    
    let newUploadedUrls: string[] = [];
    const totalFiles = files.length;
    let completedFiles = 0;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your_cloud_name"; // Replace with your cloud name
    const uploadPreset = "my_shop_preset"; // আপনার image-upload.tsx এ এই প্রিসেট দেওয়া আছে

    try {
      for (const file of files) {
        // Promise wrap for XMLHttpRequest to track live upload progress
        const uploadFile = () => new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
          const fd = new FormData();
          
          fd.append('upload_preset', uploadPreset);
          fd.append('file', file);

          xhr.upload.addEventListener('progress', (progressEvent: ProgressEvent<XMLHttpRequestEventTarget>) => {
            if (progressEvent.lengthComputable) {
              const currentFileProgress = (progressEvent.loaded / progressEvent.total) * 100;
              const overallProgress = Math.round(((completedFiles * 100) + currentFileProgress) / totalFiles);
              setUploadProgress(overallProgress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              resolve(response.secure_url);
            } else {
              reject(new Error('Upload failed'));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
          
          xhr.open('POST', url, true);
          xhr.send(fd);
        });

        const uploadedUrl = await uploadFile();
        newUploadedUrls.push(uploadedUrl);
        completedFiles++;
      }
      
      setUploadedMediaUrls((prevUrls) => [...prevUrls, ...newUploadedUrls]);
      setUploadProgress(100);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error: any) {
      console.error(error);
      setErrorMessage('Failed to upload files. Ensure your network is stable and files are valid.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (indexToRemove: number) => {
    setUploadedMediaUrls(urls => urls.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return alert("Please wait for files to finish uploading.");
    if (uploadedMediaUrls.length === 0) return alert("Please upload at least one video or image.");

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const mediaUrlString = uploadedMediaUrls.join(', ');
      const result = await submitWarrantyClaim({ ...formData, mediaUrl: mediaUrlString });

      if (!result.success) throw new Error(result.message);

      setSuccessMessage('Your warranty claim has been submitted successfully! Our team will review your video and contact you shortly.');
      
      setFormData({ name: '', orderNumber: '', shopPurchased: 'GoBike Australia', email: '', description: '' });
      setUploadedMediaUrls([]);
      setUploadProgress(0);

    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-gray-800 pb-20">
      <Breadcrumbs pageTitle="Warranty Claim Form" />

      <section className="max-w-[800px] mx-auto px-4 sm:px-6 pt-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Warranty Claim Form</h1>
          <p className="text-lg text-gray-600 bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-sm leading-relaxed">
            To help determine which bike part we need to send you, please send us a short video of your problem happening.
          </p>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-[2rem] shadow-xl border border-gray-100">
          
          {successMessage && <div className="mb-8 p-6 bg-green-50 border-l-4 border-green-500 rounded-r-xl text-green-800 font-medium">✓ {successMessage}</div>}
          {errorMessage && <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-800 font-medium">✕ {errorMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl mb-6">
              <p className="text-[13px] text-gray-600 font-medium flex items-center gap-2">
                <span className="text-blue-600 text-lg">💡</span> 
                <span><strong>Pro Tip:</strong> Ensure your email matches the one used during purchase. We will automatically fetch your shipping address securely.</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label><input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label><input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@example.com" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Original Order Number *</label><input type="text" name="orderNumber" required value={formData.orderNumber} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. #12345" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Shop Purchased From</label><input type="text" name="shopPurchased" value={formData.shopPurchased} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500" readOnly /></div>
            </div>

            {/* MULTIPLE VIDEO UPLOAD AREA */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Upload Videos or Images *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50 relative hover:border-blue-400 transition-colors">
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  accept="video/mp4, video/quicktime, image/*" 
                  onChange={handleFileSelect}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  disabled={isUploading}
                />
                
                <p className="text-xs text-gray-400 mt-4">Max file size: 500MB. Formats: MP4, MOV, JPG, PNG.</p>
                <p className="text-[11px] text-blue-500 font-semibold mt-1">You can select multiple files or upload one by one.</p>
                
                {isUploading && (
                  <div className="mt-5">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full transition-all duration-300 relative overflow-hidden" style={{ width: `${uploadProgress}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-sm text-blue-600 font-bold mt-2">Uploading Files: {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* Uploaded Files Preview List */}
              {uploadedMediaUrls.length > 0 && !isUploading && (
                <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-xl">
                  <p className="text-[13px] font-bold text-green-700 mb-3">✓ {uploadedMediaUrls.length} File(s) Ready to Submit:</p>
                  <ul className="space-y-2">
                    {uploadedMediaUrls.map((url, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-green-100 text-sm shadow-sm">
                        <a href={url} target="_blank" className="text-blue-600 hover:underline truncate max-w-[80%]">File {idx + 1} - View</a>
                        <button type="button" onClick={() => removeMedia(idx)} className="text-red-500 hover:text-white hover:bg-red-500 font-bold px-3 py-1 rounded transition-colors">Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Description *</label>
              <textarea name="description" required rows={5} value={formData.description} onChange={handleInputChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
            </div>

            <button type="submit" disabled={isSubmitting || isUploading || uploadedMediaUrls.length === 0} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed shadow-lg">
              {isSubmitting ? 'Submitting Claim...' : 'Submit Warranty Claim'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}