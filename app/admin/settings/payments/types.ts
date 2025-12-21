// app/admin/settings/payments/types.ts
import { 
  PaymentMode, 
  PaymentIntent, 
  PayPalButtonColor, 
  PayPalButtonShape, 
  PayPalButtonLayout, 
  PayPalButtonLabel, 
  PayPalLandingPage 
} from "@prisma/client"

export type PaymentMethodWithConfig = {
  id: string
  identifier: string
  name: string
  isEnabled: boolean
  mode: PaymentMode
  description: string | null
  instructions: string | null
  icon: string | null
  stripeConfig?: StripeConfigType | null
  paypalConfig?: PaypalConfigType | null
  offlineConfig?: OfflineConfigType | null
}

export type StripeConfigType = {
  id: string
  paymentMethodId: string
  enableStripe: boolean
  testMode: boolean
  title: string
  description: string
  isConnected: boolean
  accountId: string | null
  livePublishableKey: string | null
  liveSecretKey: string | null
  liveWebhookSecret: string | null
  testPublishableKey: string | null
  testSecretKey: string | null
  testWebhookSecret: string | null
  paymentAction: PaymentIntent
  statementDescriptor: string | null
  shortStatementDescriptor: string | null
  addOrderNumberToStatement: boolean
  savedCards: boolean
  inlineCreditCardForm: boolean
  applePayEnabled: boolean
  googlePayEnabled: boolean
  paymentRequestButtons: boolean
  buttonTheme: string
  debugLog: boolean
}

export type PaypalConfigType = {
  id: string
  paymentMethodId: string
  sandbox: boolean
  isOnboarded: boolean
  merchantId: string | null
  liveEmail: string | null
  liveClientId: string | null
  liveClientSecret: string | null
  sandboxEmail: string | null
  sandboxClientId: string | null
  sandboxClientSecret: string | null
  title: string
  description: string
  intent: PaymentIntent
  instantPayments: boolean
  brandName: string | null
  landingPage: PayPalLandingPage
  disableFunding: string[]
  advancedCardEnabled: boolean
  advancedCardTitle: string
  vaultingEnabled: boolean
  smartButtonLocations: string[]
  requireFinalConfirmation: boolean
  buttonLabel: PayPalButtonLabel
  buttonLayout: PayPalButtonLayout
  buttonColor: PayPalButtonColor
  buttonShape: PayPalButtonShape
  payLaterEnabled: boolean
  payLaterLocations: string[]
  payLaterMessaging: boolean
  payLaterMessageTheme: string
  subtotalMismatchBehavior: string
  invoicePrefix: string | null
  debugLog: boolean
  webhookId: string | null
  webhookUrl: string | null
}

export type OfflineConfigType = {
  id: string
  paymentMethodId: string
  bankDetails: any | null
  chequePayTo: string | null
  addressInfo: string | null
  enableForShippingMethods: string[]
}