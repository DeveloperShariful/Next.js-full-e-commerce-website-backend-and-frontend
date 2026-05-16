// components/MiniCart.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart, CartItemAttribute } from '@/context/CartContext'; // পাথ ঠিক করে নেবেন
import { IoClose } from 'react-icons/io5';
import Image from 'next/image';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { cartItems, removeFromCart, updateQuantity, loading } = useCart();
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { document.body.classList.add('no-scroll'); } 
    else { document.body.classList.remove('no-scroll'); }
    return () => { document.body.classList.remove('no-scroll'); };
  }, [isOpen]);

  const parsePrice = (price: string) => {
    const cleanedPrice = price ? String(price).replace(/<[^>]*>|[^0-9.]/g, '') : '0';
    return parseFloat(cleanedPrice) || 0;
  };

  const subtotal = cartItems.reduce((total, item) => {
    if (item.total) return total + parsePrice(item.total);
    const price = parsePrice(item.price);
    return total + price * item.quantity;
  }, 0);

  const handleRemove = async (key: string) => {
    setRemovingKey(key); 
    await removeFromCart(key);
    setRemovingKey(null);
  };

  const formatLabel = (name: string) => {
    const clean = name.replace(/^pa_/, '').replace(/_/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className={`fixed top-0 left-0 w-full h-full bg-black/50 z-[1000] transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      ></div>

      <div 
        className={`fixed top-0 right-0 w-full max-w-[450px] h-full bg-white shadow-[-5px_0_25px_rgba(0,0,0,0.15)] z-[1001] flex flex-col transition-transform duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex justify-between items-center p-6 border-b border-[#eaeaea] flex-shrink-0">
          <h3 className="m-0 text-[1.3rem] font-bold">Shopping Cart</h3>
          <button 
            className="bg-transparent border-none text-[2rem] cursor-pointer text-[#333] transition-transform duration-200 hover:rotate-90 flex items-center justify-center p-0" 
            onClick={onClose}
          >
            <IoClose />
          </button>
        </header>
        {loading && <div className="p-2 bg-[#fffbe6] text-[#9f7a00] text-center text-sm">Processing...</div>}
        <div className="flex-grow overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <p className="text-center mt-20 text-[#777] text-[1.1rem]">Your cart is empty.</p>
          ) : (
            cartItems.map(item => {
                let displayPrice = item.price;
                if (item.total && item.quantity > 0) {
                    const totalPrice = parsePrice(item.total);
                    const unitPrice = totalPrice / item.quantity;
                    displayPrice = `$${unitPrice.toFixed(2)}`;
                }

                return (
                  <div key={item.key} className="grid grid-cols-[80px_1fr] gap-x-6 gap-y-2 items-start mb-6 pb-6 border-b border-[#f0f0f0] last:border-b-0 last:mb-0">
                    <div className="col-start-1 row-span-2 self-center w-[80px] h-[80px] rounded-lg border border-[#eee] overflow-hidden">
                        {item.image ? (
                            <Image src={item.image} alt={item.name} className="w-full h-full object-cover" width={100} height={100} />
                        ) : (
                            <div className="w-full h-full bg-[#f0f0f0]"/>
                        )}
                    </div>
                    <div className="col-start-2 row-start-1 flex flex-col gap-3">
                      <p className="font-semibold m-0 leading-[1.3] text-base">{item.name}</p>
                      {item.attributes && item.attributes.length > 0 && (
                          <div className="text-xs text-[#666] -mb-1">
                              {/* এখানে any এর বদলে CartItemAttribute দেওয়া হয়েছে */}
                              {item.attributes.map((attr: CartItemAttribute, index: number) => (
                                  <span key={index} className="mr-2 capitalize">
                                      <strong>{formatLabel(attr.name)}:</strong> {attr.value}
                                  </span>
                              ))}
                          </div>
                      )}
                      <div className="flex items-center border border-[#e0e0e0] rounded-md w-fit">
                        <span className="text-base font-semibold px-4 border-r border-[#e0e0e0]">Qty: </span>
                        <button 
                            onClick={() => updateQuantity(item.key, item.quantity - 1)} 
                            disabled={loading || item.quantity <= 1}
                            className="bg-[#f9f9f9] border-none cursor-pointer text-[1.1rem] font-bold px-3 py-1.5 transition-colors duration-200 hover:bg-[#f0f0f0] disabled:text-[#aaa] disabled:cursor-not-allowed"
                        >
                            -
                        </button>
                        <span className="text-base font-semibold px-4 border-l border-r border-[#e0e0e0]">{item.quantity}</span>
                        <button 
                            onClick={() => updateQuantity(item.key, item.quantity + 1)} 
                            disabled={loading}
                            className="bg-[#f9f9f9] border-none cursor-pointer text-[1.1rem] font-bold px-3 py-1.5 transition-colors duration-200 hover:bg-[#f0f0f0] disabled:text-[#aaa] disabled:cursor-not-allowed"
                        >
                            +
                        </button>
                      </div>
                      
                      <p className="text-[#555] m-0 text-base font-medium" dangerouslySetInnerHTML={{ __html: displayPrice }}></p>
                    </div>
                    <div className="col-start-2 row-start-2 mt-2">
                        <button 
                            className="bg-transparent text-[#e53e3e] border border-[#e53e3e] rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[#e53e3e] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleRemove(item.key)} 
                            disabled={loading || removingKey === item.key}
                            style={{ opacity: removingKey === item.key ? 0.6 : 1 }}
                        >
                            {removingKey === item.key ? 'Removing...' : 'Remove'}
                        </button>
                    </div>
                  </div>
                );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <footer className="p-6 border-t border-[#eaeaea] bg-[#f8f9fa] flex-shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between text-[1.2rem] font-bold mb-6">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-3">
              <Link 
                href="/cart" 
                className="block w-full p-2 text-center no-underline rounded-lg font-bold transition-all duration-200 bg-white text-black border-2 border-black text-[1.3rem] hover:bg-[#f0f0f0]" 
                onClick={onClose}
              >
                View Cart
              </Link>
              <Link 
                href="/checkout"
                className="block w-full p-2 text-center no-underline rounded-lg font-bold transition-all duration-200 bg-black text-white border-2 border-black text-[1.5rem] hover:bg-[#333]"
                onClick={onClose}
              >
                Checkout
              </Link>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}