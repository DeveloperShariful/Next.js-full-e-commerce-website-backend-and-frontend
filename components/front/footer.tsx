// components/front/footer.tsx

import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 text-sm">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div>
            <Link href="/" className="text-2xl font-bold text-white flex items-center gap-1 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">GB</div>
              GoBike
            </Link>
            <p className="leading-relaxed mb-6">
              The ultimate destination for premium bikes and accessories. Quality, durability, and style in one place.
            </p>
            <div className="flex gap-4">
               {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                 <a key={i} href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition">
                   <Icon size={16}/>
                 </a>
               ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
             <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Quick Links</h3>
             <ul className="space-y-3">
                <li><Link href="/shop" className="hover:text-white transition">All Products</Link></li>
                <li><Link href="/categories" className="hover:text-white transition">Categories</Link></li>
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
             </ul>
          </div>

          {/* Customer Service */}
          <div>
             <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Customer Care</h3>
             <ul className="space-y-3">
                <li><Link href="/profile" className="hover:text-white transition">My Account</Link></li>
                <li><Link href="/orders" className="hover:text-white transition">Track Order</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">FAQs</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
             </ul>
          </div>

          {/* Contact */}
          <div>
             <h3 className="text-white font-bold mb-4 uppercase tracking-wider">Contact Us</h3>
             <ul className="space-y-4">
                <li className="flex gap-3">
                   <MapPin size={20} className="text-blue-500 shrink-0"/>
                   <span>123, Bike Street, Dhanmondi, Dhaka-1209, Bangladesh</span>
                </li>
                <li className="flex gap-3">
                   <Phone size={20} className="text-blue-500 shrink-0"/>
                   <span>+880 1712 345 678</span>
                </li>
                <li className="flex gap-3">
                   <Mail size={20} className="text-blue-500 shrink-0"/>
                   <span>support@gobike.com</span>
                </li>
             </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
           <p>© 2025 GoBike. All rights reserved.</p>
           <div className="flex gap-4">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6 bg-white px-2 rounded"/>
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 bg-white px-2 rounded"/>
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6 bg-white px-2 rounded"/>
           </div>
        </div>
      </div>
    </footer>
  );
}