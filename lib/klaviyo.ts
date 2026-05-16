// lib/klaviyo.ts

type KlaviyoItem = {
    ProductID: string | number;
    SKU?: string;
    ProductName: string;
    Quantity: number;
    ItemPrice: number;
    RowTotal: number;
    ProductURL: string;
    ImageURL: string;
    Categories?: string[];
};

type WindowWithKlaviyo = Window & {
  _learnq: unknown[];
};
declare const window: WindowWithKlaviyo;

/**
 * Klaviyo-এর জন্য একজন ব্যবহারকারীকে শনাক্ত করে।
 */
export const klaviyoIdentify = (user: { email: string; first_name?: string; last_name?: string; }) => {
    window._learnq = window._learnq || [];
    window._learnq.push(['identify', {
        '$email': user.email,
        '$first_name': user.first_name,
        '$last_name': user.last_name
    }]);
}

/**
 * Viewed Product ইভেন্ট ট্র্যাক করে।
 */
export const klaviyoTrackViewedProduct = (item: KlaviyoItem) => {
    window._learnq = window._learnq || [];
    window._learnq.push(['track', 'Viewed Product', item]);
}

/**
 * Added to Cart ইভেন্ট ট্র্যাক করে।
 */
export const klaviyoTrackAddedToCart = (cart: {
    total_price: number,
    item_count: number,
    items: KlaviyoItem[],
    added_item: KlaviyoItem
}) => {
    window._learnq = window._learnq || [];
    const eventData = {
        '$value': cart.added_item.ItemPrice,
        'AddedItemProductName': cart.added_item.ProductName,
        'AddedItemProductID': cart.added_item.ProductID,
        'AddedItemQuantity': cart.added_item.Quantity,
        'ItemNames': cart.items.map(i => i.ProductName),
        'CheckoutURL': '/cart',
        'Items': cart.items,
        'cart_total': cart.total_price
    };
    window._learnq.push(['track', 'Added to Cart', eventData]);
    window._learnq.push(['trackViewedItem', {
        "Title": cart.added_item.ProductName,
        "ItemId": cart.added_item.ProductID,
        "Categories": cart.added_item.Categories,
        "ImageUrl": cart.added_item.ImageURL,
        "Url": cart.added_item.ProductURL,
        "Metadata": {
            "Price": cart.added_item.ItemPrice,
            "Quantity": cart.added_item.Quantity
        }
    }]);
}


/**
 * Placed Order ইভেন্ট ট্র্যাক করে।
 */
export const klaviyoTrackPlacedOrder = (order: {
  order_id: string;
  value: number;
  item_names: string[];
  checkout_url: string;
  items: KlaviyoItem[];
}) => {
  window._learnq = window._learnq || [];

  const eventData = {
    '$event_id': order.order_id, 
    '$value': order.value,
    'ItemNames': order.item_names,
    'CheckoutURL': order.checkout_url,
    'Items': order.items,
  };

  window._learnq.push(['track', 'Placed Order', eventData]);

  order.items.forEach(item => {
    const itemEventData = {
      '$event_id': `${order.order_id}-${item.ProductID}`, 
      '$value': item.RowTotal,
      ...item 
    };
    window._learnq.push(['track', 'Ordered Product', itemEventData]);
  });
};