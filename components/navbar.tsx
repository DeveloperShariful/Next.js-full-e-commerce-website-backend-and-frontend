import Link from "next/link"; // এই লাইনটি খুব গুরুত্বপূর্ণ!
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

const Navbar = () => {
  return (
    <div className="border-b bg-white sticky top-0 z-50"> 
      {/* sticky top-0 মানে স্ক্রল করলেও মেনু উপরে ফিক্সড থাকবে */}
      
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        
        {/* লোগো */}
        <Link href="/" className="font-bold text-2xl uppercase tracking-wider flex items-center">
          MY-SHOP
        </Link>

        {/* মেনু লিংক (এখানে gap-6 ব্যবহার করা হয়েছে যাতে লেখা লেগে না যায়) */}
        <nav className="hidden md:flex items-center gap-8 font-medium">
          <Link href="/" className="hover:text-black text-gray-600 transition-colors">
            Home
          </Link>
          <Link href="/shop" className="hover:text-black text-gray-600 transition-colors">
            Shop
          </Link>
          <Link href="/categories" className="hover:text-black text-gray-600 transition-colors">
            Categories
          </Link>
        </nav>

        {/* ডান পাশের অ্যাকশন */}
        <div className="flex items-center gap-4">
          <Button className="flex items-center gap-2 rounded-full px-4 py-2 bg-black text-white hover:bg-gray-800">
            <ShoppingBag size={20} />
            <span className="font-bold">0</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;