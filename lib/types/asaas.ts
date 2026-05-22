// Types para integração ASAAS

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  value: number;
  netValue?: number;
  grossValue?: number;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'DELETED';
  dueDate: string;
  description: string;
  remoteId?: string;
  paymentDate?: string;
  creditDate?: string;
  estimatedCreditDate?: string;
  confirmedDate?: string;
  url?: string; // Boleto URL
  boletoNumber?: string;
  pixQrCode?: string;
  pixKey?: string;
  refundedAmount?: number;
  deleted?: boolean;
  externalReference?: string;
}

export interface AsaasWebhookEvent {
  event: string;
  payment: AsaasPayment;
}

export interface CheckoutData {
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  company: string;
  couponCode?: string;
  finalPrice: number;
  paymentId?: string;
  timestamp: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: string;
  [key: string]: any;
}
