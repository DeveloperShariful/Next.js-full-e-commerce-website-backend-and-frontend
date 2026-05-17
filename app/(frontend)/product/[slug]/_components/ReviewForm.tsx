// app/product/[slug]/_components/ReviewForm.tsx

'use client';

import { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { FaStar, FaImage, FaReply, FaTimes, FaPlayCircle } from 'react-icons/fa';
import Image from 'next/image';

// --- নতুন Server Action ইম্পোর্ট করা হলো ---
import { submitReviewAction } from '@/app/actions/frontend/product/submitReviewAction';

// --- Types ---
interface ReviewMedia {
  url: string;
  type: string;
}

interface ReplyEdge {
  node: {
    id: string;
    author: { node: { name: string; avatar?: { url: string } }; };
    content: string;
    date: string;
  };
}

interface ReviewEdge {
  node: {
    id: string;
    databaseId: number; 
    author: { node: { name: string; avatar?: { url: string } }; };
    content: string;
    date: string;
    reviewMedia?: ReviewMedia[]; 
    replies?: { edges: ReplyEdge[] }; 
  };
  rating: number;
}

interface ReviewFormProps {
  productId: number;
  averageRating: number | null | undefined;
  reviewCount: number | null | undefined;
  reviews: ReviewEdge[];
}

// --- Helper Components ---
const StarRatingDisplay = ({ rating }: { rating: number }) => {
  const [starRating, setStarRating] = useState({ full: 0, empty: 5 });
  useEffect(() => {
    const totalStars = 5;
    const fullStars = Math.round(rating || 0);
    const emptyStars = totalStars - fullStars;
    setStarRating({ full: fullStars, empty: emptyStars });
  }, [rating]);

  return (
    <div className="flex gap-1 text-[1.5rem] my-2 text-amber-500">
      {[...Array(starRating.full)].map((_, i) => <FaStar key={`full-${i}`} color="#ffc107" />)}
      {[...Array(starRating.empty)].map((_, i) => <FaStar key={`empty-${i}`} color="#e4e5e9" />)}
    </div>
  );
};

const FormattedDate = ({ dateString }: { dateString: string }) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  useEffect(() => { setFormattedDate(new Date(dateString).toLocaleDateString()); }, [dateString]);
  if (!formattedDate) return <span className="text-[0.85rem] text-gray-400 mt-0.5"></span>;
  return <span className="text-[0.85rem] text-gray-400 mt-0.5">{formattedDate}</span>;
};

// --- Main Component ---
export default function ReviewForm({ productId, averageRating, reviewCount, reviews }: ReviewFormProps) {
  // Main Form States
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply Form States
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // List States
  const INITIAL_REVIEWS_TO_SHOW = 5;
  const [visibleReviews, setVisibleReviews] = useState(INITIAL_REVIEWS_TO_SHOW);

  // Modal (Lightbox) States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<ReviewMedia | null>(null);

  const replyIds = new Set(
    reviews.flatMap((edge) => edge.node.replies?.edges.map((reply) => reply.node.id) || [])
  );
  const topLevelReviews = reviews.filter((edge) => !replyIds.has(edge.node.id));

  // Derived Data
  const customerImages = topLevelReviews.flatMap((edge) => edge.node.reviewMedia?.filter(m => m.type === 'image').map(m => m.url) || []);
  const hasMoreReviews = topLevelReviews.length > visibleReviews;
  const currentRating = typeof averageRating === 'number' ? averageRating : 0;
  const currentReviewCount = typeof reviewCount === 'number' ? reviewCount : 0;

  // --- Handlers ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMediaFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 🚀 API এর বদলে Server Action কল করা হচ্ছে
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    setIsSubmitting(true);
    const toastId = toast.loading('Submitting your review...');
    
    const formData = new FormData();
    formData.append('author', author);
    formData.append('email', email);
    formData.append('comment', comment);
    formData.append('rating', String(rating));
    formData.append('comment_post_ID', String(productId));
    
    mediaFiles.forEach((file) => formData.append('media[]', file));
    
    try {
      const result = await submitReviewAction(formData);

      if (result.success) {
        toast.success(result.message, { id: toastId });
        setAuthor(''); setEmail(''); setComment(''); setRating(0); setMediaFiles([]); setShowForm(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'An error occurred.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 Reply Submission Action (Uses same server action)
  const handleReplySubmit = async (e: FormEvent, parentId: number) => {
    e.preventDefault();
    setIsReplying(true);
    const toastId = toast.loading('Submitting reply...');
    
    const formData = new FormData();
    formData.append('author', replyAuthor);
    formData.append('email', replyEmail);
    formData.append('comment', replyContent);
    formData.append('rating', '5'); // Default rating for replies
    formData.append('comment_post_ID', String(productId));
    formData.append('parent_id', String(parentId));
    
    try {
      const result = await submitReviewAction(formData);

      if (result.success) {
        toast.success('Reply submitted! It will appear after approval.', { id: toastId });
        setReplyingToId(null); setReplyContent(''); setReplyAuthor(''); setReplyEmail('');
      } else {
        throw new Error(result.message);
      }
    } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'An error occurred.', { id: toastId });
    } finally {
      setIsReplying(false);
    }
  };

  const openModal = (media: ReviewMedia) => {
    setActiveMedia(media);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden'; 
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveMedia(null);
    document.body.style.overflow = 'auto'; 
  };

  return (
    <div className="w-full box-border">
        
        {/* Review Form */}
        {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 md:p-8 border border-[#e5e7eb] rounded-lg bg-white shadow-sm transition-all duration-300">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xl font-bold m-0 text-[#111]">Write a Review</h4>
                    <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-red-500 font-bold flex items-center gap-1">
                        <FaTimes /> Close
                    </button>
                </div>
                <p className="text-gray-500 m-0 mb-6 text-sm">Your email address will not be published. Required fields are marked *</p>
                
                <div className="mb-6">
                    <label className="block mb-2 font-semibold text-gray-700">Your rating *</label>
                    <div className="flex gap-2 text-[1.8rem]">
                        {[...Array(5)].map((_, index) => {
                        const ratingValue = index + 1;
                        return (
                            <label key={index} className="cursor-pointer">
                            <input type="radio" name="rating" value={ratingValue} onClick={() => setRating(ratingValue)} className="hidden" />
                            <FaStar 
                                className={`transition-colors duration-200 hover:text-amber-300 ${ratingValue <= (hover || rating) ? 'text-amber-400' : 'text-[#d1d5db]'}`} 
                                onMouseEnter={() => setHover(ratingValue)}
                                onMouseLeave={() => setHover(0)}
                            />
                            </label>
                        );
                        })}
                    </div>
                </div>

                <div className="mb-5">
                    <label htmlFor='comment' className="block mb-2 font-semibold text-sm text-gray-700">Your review *</label>
                    <textarea id='comment' value={comment} onChange={e => setComment(e.target.value)} required className="w-full p-3 border border-[#d1d5db] rounded-md text-[0.95rem] font-sans box-border min-h-[100px] resize-y" />
                </div>

                {/* Media Upload Section */}
                <div className="mb-5">
                    <label className="block mb-2 font-semibold text-sm text-gray-700">Attach Images/Videos (Optional)</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded border border-gray-300 flex items-center gap-2 transition-all text-sm font-medium">
                            <FaImage /> Choose Files
                            <input type="file" multiple accept="image/*, video/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                    {/* Media Preview */}
                    {mediaFiles.length > 0 && (
                        <div className="flex gap-3 mt-3 flex-wrap">
                            {mediaFiles.map((file, index) => (
                                <div key={index} className="relative w-20 h-20 border border-gray-200 rounded overflow-hidden">
                                    {file.type.includes('video') ? (
                                        <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                    )}
                                    <button type="button" onClick={() => removeFile(index)} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs">✕</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="mb-5">
                        <label htmlFor='author' className="block mb-2 font-semibold text-sm text-gray-700">Your Name *</label>
                        <input id='author' type="text" value={author} onChange={e => setAuthor(e.target.value)} required className="w-full p-3 border border-[#d1d5db] rounded-md text-[0.95rem] font-sans box-border" />
                    </div>
                    <div className="mb-5">
                        <label htmlFor='email' className="block mb-2 font-semibold text-sm text-gray-700">Your Email *</label>
                        <input id='email' type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border border-[#d1d5db] rounded-md text-[0.95rem] font-sans box-border" />
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="bg-gray-900 text-white border-none py-3 px-8 text-base font-semibold rounded-md cursor-pointer w-full sm:w-auto transition-colors duration-200 hover:bg-black disabled:bg-gray-400">
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        )}

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 p-6 md:p-10 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl mb-12 items-center">
            <div className="flex flex-col items-center justify-center text-center md:border-r md:border-[#e5e7eb] md:pr-8">
                <div className="text-[3rem] font-extrabold text-gray-900 leading-none">{currentRating.toFixed(1)}</div>
                <StarRatingDisplay rating={currentRating} />
                <div className="text-sm text-gray-500 mb-5">Based on {currentReviewCount} reviews</div>
                {!showForm && (
                    <button className="w-full sm:w-auto py-3 px-6 bg-white border border-[#d1d5db] rounded-md font-semibold text-gray-700 cursor-pointer transition-all duration-200 text-sm hover:bg-[#f3f4f6]" onClick={() => setShowForm(true)}>
                        Add a review
                    </button>
                )}
            </div>
            <div className="w-full flex flex-col gap-3">
                {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-3 text-[0.85rem] text-gray-600">
                        <span className="min-w-[45px] font-medium">{star} star</span>
                        <div className="flex-grow h-2 bg-[#e5e7eb] rounded overflow-hidden">
                            <div className={`h-full bg-amber-500 ${star === 5 ? 'w-full' : 'w-0'}`}></div>
                        </div>
                        <span className="min-w-[35px] text-right">{star === 5 ? '100%' : '0%'}</span>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Customer Uploaded Images Gallery */}
        {customerImages.length > 0 && (
            <div className="mb-10">
                <h3 className="text-xl font-bold mb-4 text-[#111]">Customer Images</h3>
                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-100">
                    {customerImages.map((imageUrl, index) => (
                        <div 
                            key={index} 
                            onClick={() => openModal({ url: imageUrl, type: 'image' })} 
                            className="relative w-[80px] h-[80px] flex-shrink-0 rounded-lg overflow-hidden border border-[#e5e7eb] cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <Image src={imageUrl} alt={`Customer image ${index + 1}`} fill style={{objectFit: 'cover'}} sizes="100px" />
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Reviews List */}
        <div className="mt-8 border-t border-[#e5e7eb] pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <input type="search" placeholder="Search customer reviews" className="p-2.5 px-4 border border-[#d1d5db] rounded-md w-full md:w-[300px] text-[0.9rem]" />
                
                <span>{`1-${Math.min(visibleReviews, topLevelReviews.length)} of ${topLevelReviews.length} reviews`}</span>
                
                <select className="p-2.5 pr-8 pl-4 border border-[#d1d5db] rounded-md text-[0.9rem] bg-white cursor-pointer">
                    <option>Most Recent</option>
                    <option>Highest Rating</option>
                    <option>Lowest Rating</option>
                </select>
            </div>

            {topLevelReviews.length > 0 ? (
                topLevelReviews.slice(0, visibleReviews).map((edge: ReviewEdge) => (
                    <div key={edge.node.id} className="py-6 border-b border-[#f3f4f6] last:border-b-0">
                        {/* Main Review */}
                        <div className="flex gap-4 sm:gap-6 items-start">
                            <div className="flex-shrink-0 w-[50px]">
                                <div className="w-12 h-12 rounded-full bg-[#e5e7eb] text-gray-700 flex items-center justify-center font-bold text-[1.1rem] relative after:content-['✓'] after:absolute after:-bottom-0.5 after:-right-0.5 after:bg-emerald-500 after:text-white after:w-[18px] after:h-[18px] after:rounded-full after:border-2 after:border-white after:flex after:items-center after:justify-center after:text-[10px] after:font-bold">
                                    {edge.node.author.node.name.substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <div className="flex-grow w-full">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                                    <strong className="text-base text-gray-900 font-bold">{edge.node.author.node.name}</strong>
                                    <FormattedDate dateString={edge.node.date} />
                                </div>
                                {typeof edge.rating === 'number' && edge.rating > 0 && 
                                    <div className="flex gap-0.5 text-base text-amber-500 mb-2">
                                        <StarRatingDisplay rating={edge.rating} />
                                    </div>
                                }
                                <div className="text-[0.8rem] text-emerald-500 font-semibold inline-block mb-3">✓ Verified review</div>
                                <div className="text-[0.95rem] leading-[1.6] text-gray-600 mb-3" dangerouslySetInnerHTML={{ __html: edge.node.content }} />
                                
                                {edge.node.reviewMedia && edge.node.reviewMedia.length > 0 && (
                                    <div className="flex gap-3 flex-wrap mt-2 mb-4">
                                        {edge.node.reviewMedia.map((media, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => openModal(media)} 
                                                className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity group"
                                            >
                                                {media.type === 'video' ? (
                                                    <>
                                                        <video src={media.url} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                            <FaPlayCircle className="text-white text-3xl opacity-90 group-hover:scale-110 transition-transform" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Image src={media.url} alt="Review Media" fill style={{objectFit: 'cover'}} sizes="100px" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply Button */}
                                <button 
                                    onClick={() => setReplyingToId(replyingToId === edge.node.databaseId ? null : edge.node.databaseId)} 
                                    className="text-sm text-gray-500 flex items-center gap-1 hover:text-black font-semibold mt-2 transition-colors"
                                >
                                    <FaReply /> {replyingToId === edge.node.databaseId ? 'Cancel Reply' : 'Reply'}
                                </button>

                                {/* Reply Form */}
                                {replyingToId === edge.node.databaseId && (
                                    <form onSubmit={(e) => handleReplySubmit(e, edge.node.databaseId)} className="mt-4 p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-all duration-300">
                                        <h5 className="text-sm font-bold mb-3">Leave a Reply</h5>
                                        <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} required placeholder="Write your reply..." className="w-full p-3 border border-[#d1d5db] rounded-md mb-3 text-[0.9rem] min-h-[80px]" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                            <input type="text" placeholder="Name *" value={replyAuthor} onChange={(e) => setReplyAuthor(e.target.value)} required className="w-full p-3 border border-[#d1d5db] rounded-md text-[0.9rem]" />
                                            <input type="email" placeholder="Email *" value={replyEmail} onChange={(e) => setReplyEmail(e.target.value)} required className="w-full p-3 border border-[#d1d5db] rounded-md text-[0.9rem]" />
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" disabled={isReplying} className="bg-gray-900 text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-black disabled:bg-gray-400">
                                                {isReplying ? 'Posting...' : 'Post Reply'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Render Nested Replies */}
                                {edge.node.replies && edge.node.replies.edges.length > 0 && (
                                    <div className="mt-6 ml-6 pl-5 border-l-2 border-gray-200 flex flex-col gap-5">
                                        {edge.node.replies.edges.map((reply) => (
                                            <div key={reply.node.id} className="flex gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                                                    {reply.node.author.node.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <strong className="text-[0.9rem] font-bold text-gray-900">{reply.node.author.node.name}</strong>
                                                        <FormattedDate dateString={reply.node.date} />
                                                    </div>
                                                    <div className="text-[0.9rem] leading-[1.6] text-gray-600" dangerouslySetInnerHTML={{ __html: reply.node.content }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                ))
            ) : ( <p className="text-gray-500 py-4">There are no reviews yet.</p> )}
            
            {hasMoreReviews && (
                <div className="text-center mt-8 pt-4">
                    <button className="bg-transparent border border-[#d1d5db] py-3 px-8 rounded-md cursor-pointer font-semibold text-gray-700 transition-all duration-200 hover:bg-[#f3f4f6] hover:border-[#9ca3af]" onClick={() => setVisibleReviews(topLevelReviews.length)}>
                        Show All {topLevelReviews.length} Reviews
                    </button>
                </div>
            )}
        </div>

        {/* Lightbox Modal */}
        {isModalOpen && activeMedia && (
            <div 
                className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={closeModal} 
            >
                <button 
                    className="absolute top-6 right-6 text-white text-3xl hover:text-gray-300 transition-colors cursor-pointer z-[10000]"
                    onClick={closeModal}
                    aria-label="Close"
                >
                    <FaTimes />
                </button>
                
                <div 
                    className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()} 
                >
                    {activeMedia.type === 'video' ? (
                        <video src={activeMedia.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl outline-none" />
                    ) : (
                        <img src={activeMedia.url} alt="Expanded Review Media" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none" />
                    )}
                </div>
            </div>
        )}
    </div>
  );
}