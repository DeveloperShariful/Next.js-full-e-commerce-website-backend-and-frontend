// File: app/(storefront)/checkout/_components/payment/gateways/Paypal_Buttons.tsx

"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { createPaypalOrder } from "@/app/actions/storefront/checkout/create-paypal-order";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { toast } from "sonner";
import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";

export const Paypal_Buttons = ({ cartId }: { cartId: string }) => {
  const { getValues } = useFormContext();
  const router = useRouter();

  // ১. অর্ডার তৈরি করা (Server Action কল করে)
  const createOrder = async () => {
    // ফর্ম ভ্যালিডেশন চেক (Optional: চাইলে এখানে চেক করা যায় সব ফিল্ড ফিলাপ আছে কি না)
    const formData = getValues();
    if (!formData.shippingAddress.firstName || !formData.email) {
      toast.error("Please fill in shipping details first.");
      throw new Error("Form invalid");
    }

    try {
      const res = await createPaypalOrder(cartId);
      if (res.success && res.orderId) {
        return res.orderId;
      } else {
        toast.error(res.error || "Failed to initialize PayPal");
        throw new Error(res.error);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // ২. পেমেন্ট অ্যাপ্রুভ হলে (User paid via PayPal popup)
  const onApprove = async (data: any) => {
    toast.info("Payment approved. Processing order...");
    
    const formData = getValues(); // লেটেস্ট ফর্ম ডাটা

    // ফাইনাল অর্ডার প্রসেসিং (Database Save)
    const checkoutPayload = {
      cartId,
      userId: undefined, // Guest
      guestInfo: { 
        email: formData.email, 
        name: `${formData.shippingAddress.firstName} ${formData.shippingAddress.lastName}`, 
        phone: formData.shippingAddress.phone 
      },
      shippingAddress: formData.shippingAddress,
      billingAddress: formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
      paymentMethod: "paypal",
      paymentId: data.orderID, // PayPal Order ID
      
      // TODO: রিয়েল শিপিং এবং ডিসকাউন্ট ডাটা পাস করতে হবে (State থেকে)
      shippingData: { method: "flat_rate", cost: 0 }, 
      discountId: undefined,
      // টোটাল সার্ভার সাইডে রিক্যালকুলেট হবে, এখানে জাস্ট স্ট্রাকচার পাস করছি
      totals: { subtotal: 0, tax: 0, discount: 0, total: 0 } 
    };

    try {
      const res = await processCheckout(checkoutPayload);

      if (res.success) {
        router.push(`/checkout/success?orderId=${res.orderId}`);
      } else {
        toast.error("Payment successful but order saving failed. Please contact support.");
      }
    } catch (error) {
      toast.error("Critical error processing order.");
    }
  };

  return (
    <PayPalButtons 
      style={{ layout: "vertical", shape: "rect", label: "paypal" }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={(err) => {
        console.error("PayPal Error:", err);
        toast.error("PayPal encountered an error.");
      }}
    />
  );
};