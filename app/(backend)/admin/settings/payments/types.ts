// app/admin/settings/payments/types.ts

import { Prisma } from "@prisma/client"
const paymentMethodWithConfig = Prisma.validator<Prisma.PaymentMethodConfigDefaultArgs>()({
  include: {
    stripeConfig: true,
    paypalConfig: true,
    offlineConfig: true,
  },
})

export type PaymentMethodWithConfig = Prisma.PaymentMethodConfigGetPayload<typeof paymentMethodWithConfig>

export type StripeConfigType = NonNullable<PaymentMethodWithConfig['stripeConfig']>
export type PaypalConfigType = NonNullable<PaymentMethodWithConfig['paypalConfig']>
export type OfflineConfigType = NonNullable<PaymentMethodWithConfig['offlineConfig']>

export interface PaymentMethodUI extends PaymentMethodWithConfig {
  isLoading?: boolean;
}