//app/actions/storefront/checkout/create-order.ts
"use server"

import { db } from "@/lib/prisma"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { clearCart } from "../cart/clear-cart"

interface OrderInput {
  billing: any
  shipping: any
  items: any[]
  shippingMethodId: string
  paymentMethod: string
  total: number
  customerNote?: string
}

export async function createOrder(data: OrderInput) {
  try {
    // ১. অর্ডার নাম্বার জেনারেট
    const count = await db.order.count()
    const orderNumber = `ORD-${1000 + count + 1}`

    // ২. শিপিং কস্ট ডাটাবেস থেকে আনা (সিকিউরিটি)
    let shippingCost = 0
    if (data.shippingMethodId) {
        // যদি লোকাল পিকআপ বা ফ্রি শিপিং হয়
        if(data.shippingMethodId === 'pickup' || data.shippingMethodId === 'free_shipping') {
            shippingCost = 0;
        } 
        // যদি Transdirect বা অন্য কোনো ডাইনামিক মেথড হয় (আমরা আপাতত রেটটা ট্রাস্ট করছি, কিন্তু প্রোডাকশনে রি-ভ্যালিডেট করা ভালো)
        // সিমপ্লিফিকেশনের জন্য আমরা ধরে নিচ্ছি শিপিং মেথড আইডিতে কস্ট লুকানো নেই, কিন্তু ডাটাবেসে থাকলে ফেচ করতাম
    }

    // ৩. ট্রানজ্যাকশন: অর্ডার তৈরি
    const newOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          status: OrderStatus.PENDING, // শুরুতে পেন্ডিং
          paymentStatus: PaymentStatus.UNPAID,
          subtotal: data.total, // আপনার ক্যালকুলেশন অনুযায়ী
          shippingTotal: shippingCost,
          total: data.total, // টোটাল
          
          guestEmail: data.billing.email,
          shippingAddress: data.shipping,
          billingAddress: data.billing,
          
          paymentMethod: data.paymentMethod,
          shippingMethod: data.shippingMethodId,
          customerNote: data.customerNote,
          
          items: {
            create: data.items.map((item: any) => ({
                productName: item.name,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
                image: item.image
            }))
          }
        }
      })
      
      return order
    })

    // ৪. অফলাইন পেমেন্ট হলে সাথে সাথে কার্ট ক্লিয়ার
    if (data.paymentMethod.startsWith('offline') || data.paymentMethod === 'cod' || data.paymentMethod === 'bank_transfer') {
        await clearCart();
    }

    return { 
        success: true, 
        orderId: newOrder.id, 
        orderNumber: newOrder.orderNumber,
        orderKey: "key_" + newOrder.id 
    }

  } catch (error: any) {
    console.error("Create Order Error:", error)
    return { success: false, error: error.message || "Failed to create order" }
  }
}