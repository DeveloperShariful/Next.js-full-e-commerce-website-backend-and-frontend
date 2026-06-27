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
    <PayPalCheckoutProvider clientId={clientId}>
      {children}
    </PayPalCheckoutProvider>
  );
}
