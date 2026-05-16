// lib/gtm.ts

type WindowWithDataLayer = Window & {
  dataLayer: Record<string, unknown>[];
};


declare const window: WindowWithDataLayer;


interface GTMProduct {
    item_name: string;
    item_id: number | string;
    price: number;
    quantity: number;
    item_category?: string; 
    item_brand?: string;    
}


// ==========================================================
// স্ট্যান্ডার্ড ইভেন্টগুলো
// ==========================================================

/**
 * একটি সাধারণ Pageview ইভেন্ট পাঠায়।
 * @param url - বর্তমান পেজের URL
 */
export const gtmPageView = (url: string) => {
  if (typeof window.dataLayer !== "undefined") {
    window.dataLayer.push({
      event: 'page_view', 
      page_path: url,
    });
  } else {
    console.log({
        event: 'page_view',
        page_path: url,
    });
  }
};


// ==========================================================
// ই-কমার্স ইভেন্টগুলো
// ==========================================================

/**
 * যখন কোনো ব্যবহারকারী একটি প্রোডাক্টের বিস্তারিত দেখেন।
 * @param item - দেখা প্রোডাক্টটির বিস্তারিত তথ্য
 */
export const gtmViewItem = (item: GTMProduct) => {
    if (typeof window.dataLayer !== "undefined") {
        window.dataLayer.push({
            event: 'view_item',
            ecommerce: {
                currency: 'AUD',
                value: item.price,
                items: [item]
            }
        });
    } else {
        console.log({
            event: 'view_item',
            ecommerce: {
                currency: 'AUD',
                value: item.price,
                items: [item]
            }
        });
    }
};

/**
 * যখন কোনো ব্যবহারকারী একটি প্রোডাক্ট কার্টে যোগ করেন।
 * @param item - কার্টে যোগ করা প্রোডাক্টটির তথ্য
 */
export const gtmAddToCart = (item: GTMProduct) => {
    if (typeof window.dataLayer !== "undefined") {
        window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
                currency: 'AUD',
                value: item.price * item.quantity,
                items: [item]
            }
        });
    } else {
        console.log({
            event: 'add_to_cart',
            ecommerce: {
                currency: 'AUD',
                value: item.price * item.quantity,
                items: [item]
            }
        });
    }
};


/**
 * যখন কোনো ব্যবহারকারী কার্ট থেকে একটি প্রোডাক্ট মুছে ফেলেন।
 * @param item - মুছে ফেলা প্রোডাক্টটির তথ্য
 */
export const gtmRemoveFromCart = (item: GTMProduct) => {
    if (typeof window.dataLayer !== "undefined") {
        window.dataLayer.push({
            event: 'remove_from_cart',
            ecommerce: {
                currency: 'AUD',
                value: item.price * item.quantity,
                items: [item]
            }
        });
    } else {
        console.log({
            event: 'remove_from_cart',
            ecommerce: {
                currency: 'AUD',
                value: item.price * item.quantity,
                items: [item]
            }
        });
    }
};


/**
 * যখন কোনো ব্যবহারকারী কার্ট পেজটি দেখেন।
 * @param items - কার্টে থাকা সমস্ত প্রোডাক্টের তালিকা
 */
export const gtmViewCart = (items: GTMProduct[]) => {
    const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (typeof window.dataLayer !== "undefined") {
        window.dataLayer.push({
            event: 'view_cart',
            ecommerce: {
                currency: 'AUD',
                value: totalValue,
                items: items
            }
        });
    } else {
        console.log({
            event: 'view_cart',
            ecommerce: {
                currency: 'AUD',
                value: totalValue,
                items: items
            }
        });
    }
};
export const gtmBeginCheckout = (items: GTMProduct[]) => {
    const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (typeof window.dataLayer !== "undefined") {
        window.dataLayer.push({
            event: 'begin_checkout',
            ecommerce: {
                currency: 'AUD',
                value: totalValue,
                items: items
            }
        });
    }
};

/**
 * যখন কোনো ব্যবহারকারী সফলভাবে একটি কেনাকাটা সম্পন্ন করেন।
 * @param data - অর্ডারের বিস্তারিত তথ্য
 */
export const gtmPurchase = (data: {
  transaction_id: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency: string;
  coupon?: string;
  items: GTMProduct[];
}) => {
  if (typeof window.dataLayer !== "undefined") {
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: data
    });
  } else {
    console.log({
      event: 'purchase',
      ecommerce: data
    });
  }
};