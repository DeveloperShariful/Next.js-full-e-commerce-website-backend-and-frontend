// app/actions/storefront/checkout/email-generator.ts

import { format } from "date-fns";

interface EmailGeneratorProps {
  order: any; 
  config: any; 
  template: any; 
}

const getReadablePaymentMethod = (method: string | null) => {
  if (!method) return "N/A";
  
  const formattedMap: Record<string, string> = {
    "stripe": "Credit/Debit Card (Stripe)",
    "paypal": "PayPal",
    "cod": "Cash on Delivery",
    "bank_transfer": "Direct Bank Transfer",
    "cheque": "Cheque Payment"
  };

  return formattedMap[method] || method.replace(/_/g, " ").toUpperCase();
};

const safeReplace = (text: string, variables: Record<string, string | number | null | undefined>) => {
    if (!text) return "";
    let result = text;
    Object.keys(variables).forEach(key => {
        const value = variables[key];
        const safeValue = value === null || value === undefined ? "" : String(value);
        const regex = new RegExp(`{${key}}`, "g");
        result = result.replace(regex, safeValue);
    });
    return result;
};

export const generateEmailHtml = ({ order, config, template }: EmailGeneratorProps) => {
  const baseColor = config.baseColor || "#7f54b3"; 
  const bgColor = config.backgroundColor || "#f7f7f7";
  const bodyColor = config.bodyBackgroundColor || "#ffffff";
  const currency = order.currency || "$";

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount).replace('USD', currency);
  };

  const paymentMethodName = getReadablePaymentMethod(order.paymentMethod);
  const billing = order.billingAddress || {};
  const shipping = order.shippingAddress || {};

  const variables = {
      customer_name: order.user?.name || billing.firstName || "Customer",
      order_number: order.orderNumber,
      total_amount: formatMoney(order.total),
      payment_method: paymentMethodName,
      tracking_number: order.shippingTrackingNumber || "N/A",
      courier: order.shippingProvider || "Courier",
      order_date: format(new Date(order.createdAt), "MMMM do, yyyy"),
      shipping_address: `${shipping.address1 || ''} ${shipping.city || ''}`,
      billing_address: `${billing.address1 || ''} ${billing.city || ''}`
  };

  let introText = safeReplace(template.content, variables);

  const productRows = order.items.map((item: any) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; font-family: 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif; color: #636363;">
        <div style="font-size: 14px; font-weight: 600; color: #333;">${item.productName}</div>
        ${item.sku ? `<div style="font-size: 12px; color: #999;">SKU: ${item.sku}</div>` : ''}
        ${item.variantName ? `<div style="font-size: 12px; color: #999;">Variant: ${item.variantName}</div>` : ''}
      </td>
      <td style="padding: 12px; font-family: 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif; color: #636363; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; font-family: 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif; color: #636363; text-align: right;">
        ${formatMoney(item.price)}
      </td>
    </tr>
  `).join("");

  let totalsHtml = `
    <tr>
      <td colspan="2" style="padding: 12px; border-top: 1px solid #eee; font-weight: 600; color: #636363;">Subtotal:</td>
      <td style="padding: 12px; border-top: 1px solid #eee; text-align: right; color: #636363;">${formatMoney(order.subtotal)}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding: 12px; font-weight: 600; color: #636363;">Shipping:</td>
      <td style="padding: 12px; text-align: right; color: #636363;">${formatMoney(order.shippingTotal)} <br/><span style="font-size: 10px; font-weight: normal;">via ${order.shippingMethod || 'Standard'}</span></td>
    </tr>
  `;

  if (order.discountTotal > 0) {
    totalsHtml += `
    <tr>
      <td colspan="2" style="padding: 12px; font-weight: 600; color: #636363;">Discount:</td>
      <td style="padding: 12px; text-align: right; color: #636363;">-${formatMoney(order.discountTotal)}</td>
    </tr>`;
  }

  if (order.taxTotal > 0) {
    totalsHtml += `
    <tr>
      <td colspan="2" style="padding: 12px; font-weight: 600; color: #636363;">Tax:</td>
      <td style="padding: 12px; text-align: right; color: #636363;">${formatMoney(order.taxTotal)}</td>
    </tr>`;
  }

  if (order.refundedAmount > 0) {
    totalsHtml += `
    <tr>
      <td colspan="2" style="padding: 12px; font-weight: 600; color: #d9534f;">Refunded:</td>
      <td style="padding: 12px; text-align: right; color: #d9534f;">-${formatMoney(order.refundedAmount)}</td>
    </tr>`;
  }

  totalsHtml += `
    <tr>
      <td colspan="2" style="padding: 12px; font-weight: 600; color: #636363;">Payment method:</td>
      <td style="padding: 12px; text-align: right; color: #636363;">${paymentMethodName}</td>
    </tr>
    <tr>
      <td colspan="2" style="padding: 12px; font-weight: 700; color: ${baseColor}; font-size: 16px; border-top: 2px solid #eee;">Total:</td>
      <td style="padding: 12px; text-align: right; font-weight: 700; color: ${baseColor}; font-size: 16px; border-top: 2px solid #eee;">${formatMoney(order.total - (order.refundedAmount || 0))}</td>
    </tr>
  `;

  let actionButton = "";
  
  if (template.triggerEvent === "ORDER_SHIPPED" && order.shippingTrackingUrl) {
    actionButton = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${order.shippingTrackingUrl}" style="background-color: ${baseColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Track Your Order</a>
      </div>
    `;
  }
  
  if (template.triggerEvent === "PAYMENT_FAILED") {
    const payLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/checkout/pay/${order.id}`;
    actionButton = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payLink}" style="background-color: #d9534f; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Pay Now</a>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 0;">
                
                ${config.headerImage ? `
                <div style="margin-bottom: 20px;">
                    <img src="${config.headerImage}" alt="${config.senderName}" style="max-width: 150px; height: auto;">
                </div>` : `<h1 style="color: ${baseColor}; margin-bottom: 20px;">${config.senderName}</h1>`}

                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: ${bodyColor}; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background-color: ${baseColor}; padding: 30px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 300;">${template.heading || "Order Notification"}</h1>
                            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                                Order #${order.orderNumber} • ${format(new Date(order.createdAt), "MMMM do, yyyy")}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px;">
                            
                            <div style="color: #636363; font-size: 14px; line-height: 150%; margin-bottom: 20px;">
                                ${introText}
                            </div>

                            ${actionButton}

                            <h2 style="color: ${baseColor}; font-size: 18px; margin-bottom: 15px;">Order Details</h2>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e5e5; border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding: 12px; border-bottom: 1px solid #eee; color: #636363;">Product</th>
                                        <th style="text-align: center; padding: 12px; border-bottom: 1px solid #eee; color: #636363;">Quantity</th>
                                        <th style="text-align: right; padding: 12px; border-bottom: 1px solid #eee; color: #636363;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productRows}
                                </tbody>
                                <tfoot>
                                    ${totalsHtml}
                                </tfoot>
                            </table>

                            <br/><br/>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="top" width="50%" style="padding-right: 10px;">
                                        <h3 style="color: ${baseColor}; font-size: 16px; margin-bottom: 10px;">Billing address</h3>
                                        <div style="border: 1px solid #e5e5e5; padding: 15px; border-radius: 4px; color: #636363; font-size: 13px; line-height: 1.5;">
                                            <strong>${billing.firstName} ${billing.lastName}</strong><br/>
                                            ${billing.address1}<br/>
                                            ${billing.city}, ${billing.state} ${billing.postcode}<br/>
                                            ${billing.country}<br/>
                                            ${billing.phone}<br/>
                                            ${billing.email || order.user?.email || order.guestEmail}
                                        </div>
                                    </td>
                                    <td valign="top" width="50%" style="padding-left: 10px;">
                                        <h3 style="color: ${baseColor}; font-size: 16px; margin-bottom: 10px;">Shipping address</h3>
                                        <div style="border: 1px solid #e5e5e5; padding: 15px; border-radius: 4px; color: #636363; font-size: 13px; line-height: 1.5;">
                                            <strong>${shipping.firstName} ${shipping.lastName}</strong><br/>
                                            ${shipping.address1}<br/>
                                            ${shipping.city}, ${shipping.state} ${shipping.postcode}<br/>
                                            ${shipping.country}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

                <div style="margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>${config.footerText}</p>
                </div>

            </td>
        </tr>
    </table>
</body>
</html>
  `;
};