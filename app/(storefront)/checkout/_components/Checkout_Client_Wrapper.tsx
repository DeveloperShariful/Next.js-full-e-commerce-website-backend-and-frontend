// File: app/(storefront)/checkout/_components/Checkout_Client_Wrapper.tsx

"use client";

import { useState } from "react";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckoutFormSchema, CheckoutFormValues } from "../schemas";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";

// Component Imports
import { Contact_Info_Form } from "./forms/Contact_Info_Form";
import { Address_Form } from "./forms/Address_Form";
import { Shipping_Method_Selector } from "./shipping/Shipping_Method_Selector";
import { Payment_Selection } from "./payment/Payment_Selection";
import { Order_Summary } from "./summary/Order_Summary";

interface WrapperProps {
  initialData: any; 
  cartId: string;
}

export const Checkout_Client_Wrapper = ({ initialData, cartId }: WrapperProps) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const currency = initialData.settings?.currency || "AUD";

  const form = useForm<CheckoutFormValues>({
   // resolver: zodResolver(CheckoutFormSchema),
    defaultValues: {
      email: initialData.user?.email || initialData.user?.emailAddresses?.[0]?.emailAddress || "",
      createAccount: false,
      sameAsShipping: true,
      agreeTerms: false,
      shippingAddress: {
        country: "AU",
        firstName: initialData.savedAddresses?.[0]?.firstName || "",
        lastName: initialData.savedAddresses?.[0]?.lastName || "",
        company: initialData.savedAddresses?.[0]?.company || "", 
        address1: initialData.savedAddresses?.[0]?.address1 || "",
        address2: initialData.savedAddresses?.[0]?.address2 || "", 
        city: initialData.savedAddresses?.[0]?.city || "",
        state: initialData.savedAddresses?.[0]?.state || "",
        postcode: initialData.savedAddresses?.[0]?.postcode || "",
        phone: initialData.savedAddresses?.[0]?.phone || "",
      },
      billingAddress: { country: "AU", firstName: "", lastName: "", company: "", address1: "", address2: "", city: "", state: "", postcode: "", phone: "" },
      shippingMethod: "",
      paymentMethod: "", 
    },
  });

  const { watch, handleSubmit } = form;
  const sameAsShipping = watch("sameAsShipping");
  const shippingCost = watch("shippingCost" as any) || 0;

  // ✅ Valid Submission Handler
  const onSubmit: SubmitHandler<CheckoutFormValues> = async (values) => {
    console.log("🔵 [CLIENT] Submit Button Clicked. Form is Valid.");
    console.log("📦 Form Data:", values);

    // 1. Online Payment Check
    if (values.paymentMethod === 'stripe' || values.paymentMethod === 'paypal') {
        console.log("ℹ️ Online payment selected. Skipping offline submit.");
        toast.info("Please click the 'Pay Now' button inside the payment section.");
        return;
    }

    setIsProcessing(true);
    try {
      const checkoutPayload = {
        cartId,
        userId: undefined,
        guestInfo: { 
            email: values.email, 
            name: `${values.shippingAddress.firstName} ${values.shippingAddress.lastName}`, 
            phone: values.shippingAddress.phone 
        },
        shippingAddress: values.shippingAddress,
        billingAddress: values.sameAsShipping ? values.shippingAddress : values.billingAddress,
        paymentMethod: values.paymentMethod,
        paymentId: undefined,
        
        shippingData: { 
            method: values.shippingMethod.includes("transdirect") ? "transdirect" : "flat_rate", 
            cost: shippingCost,
            carrier: values.shippingMethod 
        },
        
        discountId: undefined,
        totals: { subtotal: 0, tax: 0, discount: 0, total: 0 } 
      };

      console.log("🚀 [CLIENT] Calling processCheckout Server Action...");
      const res = await processCheckout(checkoutPayload);
      console.log("🟢 [CLIENT] Server Response:", res);

      if (res.success) {
        toast.success("Order placed successfully!");
        router.push(`/checkout/success?orderId=${res.orderId}`);
      } else {
        console.error("❌ [CLIENT] Server Error:", res.error);
        toast.error(res.error || "Failed to place order.");
      }
      
    } catch (error) {
      console.error("🔥 [CLIENT] Critical Error:", error);
      toast.error("Something went wrong processing your order.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ❌ Validation Error Handler
  const onError = (errors: FieldErrors<CheckoutFormValues>) => {
    console.error("🔴 [CLIENT] Form Validation Failed!", errors);
    
    // নির্দিষ্ট এরর মেসেজ টোস্টে দেখানো
    if (errors.shippingMethod) {
        toast.error("Please select a shipping method.");
    } else if (errors.paymentMethod) {
        toast.error("Please select a payment method.");
    } else if (errors.agreeTerms) {
        toast.error("You must agree to terms & conditions.");
    } else {
        toast.error("Please fill in all required fields.");
    }
  };

  return (
    <Form {...form}>
      {/* handleSubmit এ আমরা onError ফাংশনটিও পাস করছি */}
      <form onSubmit={handleSubmit(onSubmit, onError)} className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8">
          <section><h2 className="text-xl font-semibold mb-4 text-gray-900">Contact Information</h2><Contact_Info_Form /></section>
          <section><h2 className="text-xl font-semibold mb-4 text-gray-900">Shipping Address</h2><Address_Form type="shipping" /></section>
          
          <section>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold text-gray-900">Billing Address</h2></div>
            {!sameAsShipping && <Address_Form type="billing" />}
          </section>

          <section><h2 className="text-xl font-semibold mb-4 text-gray-900">Shipping Method</h2><Shipping_Method_Selector cartId={cartId} /></section>
          <section><h2 className="text-xl font-semibold mb-4 text-gray-900">Payment</h2>
            <Payment_Selection methods={initialData.paymentMethods} cartId={cartId} currencySymbol={currency}/>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 mt-10 lg:mt-0">
          <div className="sticky top-20">
            <Order_Summary cart={initialData.cart} />
          </div>
        </div>

      </form>
    </Form>
  );
};