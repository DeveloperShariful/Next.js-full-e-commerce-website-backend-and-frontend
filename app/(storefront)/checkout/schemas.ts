// File: app/(storefront)/checkout/schemas.ts

import { z } from "zod";

// ১. হুবহু এই কোডটি কপি করুন
export const AddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  
  // FIX: .optional() বাদ দিয়েছি। এখন এটি শুধু string। খালি স্ট্রিং "" এলাউড।
  company: z.string(), 
  
  address1: z.string().min(1, "Address is required"),
  
  // FIX: .optional() বাদ। খালি স্ট্রিং "" এলাউড।
  address2: z.string(),
  
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postcode: z.string().min(3, "Invalid postcode"),
  country: z.string().default("AU"),
  phone: z.string().min(8, "Phone number is too short"),
});

export const CheckoutFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  
  // Boolean fields
  createAccount: z.boolean(), 
  sameAsShipping: z.boolean(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),

  // Nested Objects
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,

  shippingMethod: z.string().min(1, "Select shipping"),
  paymentMethod: z.string().min(1, "Select payment"),
});

export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;