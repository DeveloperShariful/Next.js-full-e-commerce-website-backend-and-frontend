import { db } from '@/lib/prisma';
import PayPalCheckoutProvider from './_components/PayPalCheckoutProvider';

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const paypalGateway = await db.paymentGateway.findUnique({
    where: { identifier: 'paypal' },
    select: { publicKey: true, isEnabled: true },
  });

  const clientId = paypalGateway?.isEnabled && paypalGateway.publicKey
    ? paypalGateway.publicKey
    : null;

  return (
    <>
      {/* React 19 hoists these into <head>. They open DNS + TCP + TLS to Stripe's
          hosts while the page is still hydrating, so loadStripe() and the Express
          Checkout iframe don't pay for the handshake when they actually run —
          typically 100-300ms saved on a mobile network.

          No crossOrigin attribute on purpose: Stripe.js loads as a classic
          <script>, which is a non-CORS request, and a crossorigin preconnect
          would open a second connection that nothing uses. */}
      <link rel="preconnect" href="https://js.stripe.com" />
      <link rel="preconnect" href="https://m.stripe.network" />
      <link rel="preconnect" href="https://pay.google.com" />

      <PayPalCheckoutProvider clientId={clientId}>
        {children}
      </PayPalCheckoutProvider>
    </>
  );
}
