// lib/stripe-payment-method.ts
//
// Stripe-এর Payment/Express Checkout Element একটাই বাটনে Card, Link, Apple Pay,
// Google Pay — সবগুলো wallet একসাথে দেখায়। ফলে checkout-এর সময় frontend আসলে
// জানেই না customer শেষ পর্যন্ত কোনটা দিয়ে pay করলো — সবকিছুই generic
// 'stripe' selection হিসেবে যায় (দেখুন: stripe/create-order/route.ts)।
//
// আসল পেমেন্ট মেথড শুধু payment সফল হওয়ার *পরে*, Stripe-এর Charge অবজেক্টের
// payment_method_details ফিল্ড থেকেই জানা যায়:
//   - type === 'link'                     → Link দিয়ে পে করা হয়েছে
//   - type === 'card' && card.wallet.type → Apple Pay / Google Pay (এগুলো
//     Stripe-এর কাছে এখনো একটা "card" charge, শুধু wallet সাব-ফিল্ডে বলে
//     দেয় কোন wallet ব্যবহার হয়েছে)
//   - type === 'card' (wallet নেই)         → সাধারণ Credit/Debit Card
//   - অন্য যেকোনো type (klarna, afterpay_clearpay, zip, ইত্যাদি) → BNPL,
//     এগুলোর label আগে থেকেই order তৈরির সময় সঠিকভাবে সেট করা থাকে —
//     তাই এখানে touch করা হয় না (নিচে null রিটার্ন হবে)।
export function derivePaymentMethodLabel(charge: { payment_method_details?: unknown } | null | undefined): string | null {
  const details = charge?.payment_method_details as
    | { type?: string; card?: { wallet?: { type?: string } | null } }
    | undefined;

  if (!details?.type) return null;

  // এখানে ইচ্ছাকৃতভাবে "via" prefix রাখা হয়নি — DB-তে সবসময় bare নাম থাকে
  // (Klarna/Zip Pay/PayTo-র মতোই কনভেনশন), যার যেখানে "via X" ফরম্যাট লাগবে
  // (যেমন order-success পেজ, বা admin order-list-এর প্রথম view) সে নিজে prefix
  // বসাবে — নাহলে admin order-list-table.tsx:388-এর আগে থেকে থাকা hardcoded
  // "via {paymentMethod}"-এর সাথে মিলে "via via Link" ডাবল হয়ে যেত।
  if (details.type === 'link') return 'Link';

  if (details.type === 'card') {
    const walletType = details.card?.wallet?.type;
    if (!walletType) return null; // সাধারণ card — আগের generic label-ই ঠিক আছে

    const WALLET_LABELS: Record<string, string> = {
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay',
      samsung_pay: 'Samsung Pay',
      link: 'Link',
      amex_express_checkout: 'Amex Express Checkout',
    };
    return WALLET_LABELS[walletType] || null;
  }

  return null; // BNPL ও অন্য সব ধরনের payment method — অপরিবর্তিত থাকবে
}
