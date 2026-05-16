// components/Footer.tsx

'use client';
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok , FaLinkedinIn, FaPinterestP} from 'react-icons/fa';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script'; 
import { subscribeNewsletter } from '@/app/actions/storefront/footer/subscribe-action';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const trustBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Trustpilot && trustBoxRef.current) {
      (window as any).Trustpilot.loadFromElement(trustBoxRef.current, true);
    }
  }, []);

  const handleSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setFeedbackMessage('Subscribing...');

    try {
        const formData = new FormData();
        formData.append('email', email);

        // Call the server action directly
        const result = await subscribeNewsletter(formData);

        if (result.success) {
            setStatus('success');
            setFeedbackMessage(result.message);
            setEmail(''); // Clear input
        } else {
            setStatus('error');
            setFeedbackMessage(result.message);
        }

    } catch (error: unknown) {
        setStatus('error');
        setFeedbackMessage('Failed to subscribe. Please try again.');
    } finally {
        setTimeout(() => {
            setFeedbackMessage('');
            setStatus('idle');
        }, 5000);
    }
  };

  return (
    <footer id="colophon" className="font-sans bg-white">
      
      {/* Subscription Section */}
      <div className="bg-[#fdf5f5] px-5 py-10 items-center">
          <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                  <h3 className="text-lg md:text-xl font-bold mb-2 uppercase tracking-widest">SIGN UP FOR YOUR CHANCE TO WIN A GOBIKE!</h3>
                  <p className="text-[#555] leading-relaxed">We are giving away a new Gobike to one of our subscribers. All you need to do is subscribe, and you could be our winner! Good luck 👍</p>
              </div>
              
              <div>
                  <form className="flex bg-white border border-[#ddd] rounded-lg overflow-hidden max-w-full md:max-w-[400px]" onSubmit={handleSubscription}>
                      <input 
                        type="email" 
                        name="subscriber_email" 
                        placeholder="email@address.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        className="flex-grow border-none p-3 text-base outline-none w-full" 
                        disabled={status === 'loading'}
                      />
                      <button 
                        type="submit" 
                        disabled={status === 'loading'}
                        className="bg-black text-white border-none py-2 px-4 text-sm md:text-base font-semibold cursor-pointer flex items-center gap-2 whitespace-nowrap disabled:opacity-70"
                      >
                          {status === 'loading' ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                          )}
                          <span>Sign Up</span>
                      </button>
                  </form>
                  {feedbackMessage && (
                    <p className={`text-sm font-bold mt-2.5 ${status === 'success' ? 'text-[#28a745]' : 'text-[#dc3545]'}`}>
                        {feedbackMessage}
                    </p>
                  )}
              </div>
          </div>
      </div>

      {/* Main Footer Content */}
      <div className="bg-white text-[#1a1a1a] py-12 px-4 border-t border-[#e9e9e9]">
          
          <div className="grid max-w-[1500px] mx-auto gap-x-8 gap-y-10 grid-cols-2 lg:grid-cols-5">
              
              {/* --- Logo & Trustpilot Column --- */}
              <div className="col-span-2 lg:col-span-1 flex flex-col justify-center items-center lg:justify-start lg:items-start gap-5 mb-2 lg:mb-0 border-b lg:border-none pb-6 lg:pb-0 border-[#f0f0f0]">
                 
                 <Link href="/">
                  <Image 
                    src="https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids.webp" 
                    alt="GoBike Australia Logo"  
                    width={1861} 
                    height={430} 
                    className="w-[200px] md:w-[250px] h-auto" 
                  />
                 </Link>

                 {/* Trustpilot Widget Box */}
                 <div
                    ref={trustBoxRef}
                    className="trustpilot-widget"
                    data-locale="en-AU"
                    data-template-id="56278e9abfbbba0bdcd568bc"
                    data-businessunit-id="69da0c2911093f0a759595de"
                    data-style-height="52px"
                    data-style-width="100%"
                    data-theme="light"
                    data-token="2adfbbad-3298-4a8e-bd6f-72911d3d8f4d"
                  >
                    <a href="https://au.trustpilot.com/review/gobike.au" target="_blank" rel="noopener noreferrer">
                      Trustpilot
                    </a>
                  </div>
              </div>

              {/* Follow Us Column */}
              <div>
                <h3 className="text-lg font-bold mb-4 capitalize border-b-2 border-[#1a1a1a] pb-3 inline-block">Follow Us</h3>
                <ul className="list-none p-0 m-0 space-y-3 mt-3 md:mt-0">
                    <li>
                      <a href="https://www.facebook.com/Go-Bike-104997195659873" target="_blank" rel="noopener noreferrer" className="text-[#555] flex items-center gap-3 hover:text-black font-medium transition-colors">
                        <FaFacebookF className="w-6 h-6 text-white bg-[#1877F2] rounded-full p-1" />
                        <span>Facebook</span>
                      </a>
                    </li>
                    <li>
                      <a href="https://www.instagram.com/gobikeoz/" target="_blank" rel="noopener noreferrer" className="text-[#555] flex items-center gap-3 hover:text-black font-medium transition-colors">
                        <FaInstagram className="w-6 h-6 text-white bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-full p-1" />
                        <span>Instagram</span>
                      </a>
                    </li>
                    <li>
                      <a href="https://www.youtube.com/@Gobike-r7b" target="_blank" rel="noopener noreferrer" className="text-[#555] flex items-center gap-3 hover:text-black font-medium transition-colors">
                        <FaYoutube className="w-6 h-6 text-[#ff0000] bg-white" />
                        <span>Youtube</span>
                      </a>
                    </li>
                    <li>
                      <a href="https://www.tiktok.com/@gobikeoz" target="_blank" rel="noopener noreferrer" className="text-[#555] flex items-center gap-3 hover:text-black font-medium transition-colors">
                        <FaTiktok className="w-6 h-6 text-black bg-white" />
                        <span>TikTok</span>
                      </a>
                    </li>
                    <li>
                      <a href="https://www.linkedin.com/company/112710706" target="_blank" rel="noopener noreferrer" className="text-[#555] flex items-center gap-3 hover:text-black font-medium transition-colors">
                        <FaLinkedinIn className="w-6 h-6 text-white bg-[#0A66C2] rounded-full p-1" />
                        <span>LinkedIn</span>
                      </a>
                    </li>
                    <li>
                      <a href="#" target="_blank" rel="noopener noreferrer" className="text-[#555] flex items-center gap-3 hover:text-black font-medium transition-colors">
                        <FaPinterestP className="w-6 h-6 text-white bg-[#E60023] rounded-full p-1" />
                        <span>Pinterest</span>
                      </a>
                    </li>
                </ul>
              </div>

              {/* Quick Links Column */}
              <div>
                  <h3 className="text-lg font-bold mb-4 capitalize border-b-2 border-[#1a1a1a] pb-2 inline-block">Quick Links</h3>
                  <ul className="list-none p-0 m-0 space-y-2">
                      {['/', '/bikes', '/electric-bike-parts', '/shop', '/about', '/blog', '/warranty', '/discount'].map((path) => (
                        <li key={path}>
                            <Link href={path} className="text-[#555] hover:text-black hover:font-bold transition-all">
                                {path === '/' ? 'Home' : path === '/electric-bike-parts' ? 'Spare Parts' : path.substring(1).replace(/^\w/, c => c.toUpperCase())}
                            </Link>
                        </li>
                      ))}
                  </ul>
              </div>

              {/* Customers Column */}
              <div>
                  <h3 className="text-lg font-bold mb-4 capitalize border-b-2 border-[#1a1a1a] pb-2 inline-block">Customers</h3>
                  <ul className="list-none p-0 m-0 space-y-2">
                      <li><a href="https://gobikes.au/my-account/" className="text-[#555] hover:text-black hover:font-bold transition-all">Log In/Register</a></li>
                      
                      {['/track-order', '/shipping-policy', '/contact', '/faq', '/terms-and-conditions', '/privacy-policy', '/refund-and-returns-policy'].map((path) => (
                        <li key={path}>
                            <Link href={path} className="text-[#555] hover:text-black hover:font-bold transition-all">
                                {
                                  path === '/contact' ? 'Contact Us' : 
                                  path === '/faq' ? 'FAQs' : 
                                  path === '/terms-and-conditions' ? 'Terms & Condition' : 
                                  path.substring(1).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                }
                            </Link>
                        </li>
                      ))}
                  </ul>
              </div>
              
              {/* Our Promise Column */}
              <div>
                  <h3 className="text-lg font-bold mb-4 capitalize border-b-2 border-[#1a1a1a] pb-2 inline-block">Our Promise</h3>
                  <div className="space-y-3">
                    {[
                        { text: '1 Year Full Warranty', iconPath: "M9 12l2 2 4-4", extra: <circle cx="12" cy="12" r="10"></circle> },
                        { text: 'Fast Shipping Aus-Wide', iconPath: "M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1" },
                        { text: 'Expert Aussie Support', iconPath: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", extra: <><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></> },
                        { text: '100% Secure Checkout', iconPath: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
                        { text: 'Easy 30 days returns', iconPath: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-[#555] hover:text-black font-medium transition-colors">
                            <svg className="w-5 h-5 text-[#333]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {item.extra}
                                <path d={item.iconPath}></path>
                            </svg>
                            <span>{item.text}</span>
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="bg-black text-white p-5 text-sm">
          <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row flex-wrap justify-between items-center gap-4 text-center md:text-left">
              <div>Copyright &copy; {new Date().getFullYear()} GoBike All Rights Reserved</div>
              <div>
                  <Image src="https://gobikes.au/wp-content/uploads/2018/07/trust-symbols_b.jpg" width={1600} height={168} alt="Secure Payment Methods" className="max-h-[35px] w-auto" />
              </div>
          </div>
      </div>
      <Script 
        type="text/javascript" 
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" 
        strategy="lazyOnload" 
      />
    </footer>
  );
}