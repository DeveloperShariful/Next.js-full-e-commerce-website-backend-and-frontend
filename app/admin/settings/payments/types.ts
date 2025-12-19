// File: app/admin/settings/payments/types.ts

import { StripeConfig, PaypalConfig } from "@prisma/client";

export interface PaymentMethod {
    id: string;
    identifier: string; // 'bacs', 'cheque', 'cod', 'stripe', 'paypal'
    name: string;
    description: string | null;
    isEnabled: boolean;
    displayOrder: number;
    settings: any; // JSON for generic settings
    
    stripeConfig?: StripeConfig | null;
    paypalConfig?: PaypalConfig | null;
}

export interface PaymentMethodProps {
    method: PaymentMethod;
    onSave: (formData: FormData) => Promise<void>;
    onBack: () => void;
    loading: boolean;
}