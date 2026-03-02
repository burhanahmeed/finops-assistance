// Transaction types
export interface MayarFee {
  id: string;
  balanceHistoryType: "mayar_fee" | "xendit_fee";
  debit: number;
}

export interface MayarCustomer {
  id: string;
  name: string;
  email: string;
  mobile?: string;
}

export interface MayarPaymentLinkTransaction {
  id: string;
  isAdminFeeBorneByCustomer: boolean;
  isChannelFeeBorneByCustomer: boolean;
}

export interface MayarPaymentLink {
  id: string;
  name: string;
}

export interface MayarXenditTransaction {
  id: string;
  paymentLinkTransactionId: string;
  paymentLinkTransaction: {
    id: string;
    couponUsage: null | unknown;
  };
}

export interface MayarTransaction {
  id: string;
  credit: number;
  status: "settled" | "pending" | "failed";
  balanceHistoryType: string;
  paymentMethod: string;
  customerId: string;
  createdAt: number; // timestamp in milliseconds
  paymentLinkTransactionId: string;
  fee: MayarFee[];
  paymentLinkId: string;
  subscriptionId: string | null;
  xenditTransactionId: string;
  subscription: null | unknown;
  paymentLinkTransaction: MayarPaymentLinkTransaction;
  customer: MayarCustomer;
  paymentLink: MayarPaymentLink;
  xenditTransaction: MayarXenditTransaction;
}

// Unpaid Transaction types
export interface MayarUnpaidTransaction {
  id: string;
  createdAt: number;
  type: string;
  amount: number;
  status: "active" | "expired" | "paid";
  customerId: string;
  paymentLinkId: string;
  customer: MayarCustomer;
  paymentLink: Record<string, unknown>;
  paymentUrl: string;
}

// Product types
export interface MayarProductOrder {
  id: string;
  variant: string | null;
  length: number;
  width: number;
  weight: number;
}

export interface MayarImage {
  id: string;
  fileType: string;
  createdAt?: number;
  updatedAt?: number;
  url: string;
}

export interface MayarProduct {
  id: string;
  amount: number;
  category: string | null;
  createdAt: number; // timestamp in milliseconds
  description: string;
  link: string;
  type: "digital_product" | "physical_product" | "ebook" | "podcast" | "audiobook" | "webinar" | "fundraising" | "invoice";
  status: "active" | "inactive";
  name: string;
  limit: number | null;
  redirectUrl: string | null;
  event: null | unknown;
  order: MayarProductOrder | null;
  coverImageId: string | null;
  multipleImageId: string | null;
  coverImage: MayarImage | null;
  multipleImage: MayarImage[] | null;
}

// Invoice types
export interface MayarInvoice {
  id: string;
  amount: number;
  category: string | null;
  createdAt: number; // timestamp in milliseconds
  description: string;
  link: string;
  type: string;
  status: "paid" | "unpaid" | "expired";
  name: string;
  redirectUrl: string | null;
  customerId: string;
  transactions: unknown[];
  customer: MayarCustomer;
}

// Payment Request types
export interface MayarPaymentRequest {
  id: string;
  amount: number;
  category: string | null;
  createdAt: number; // timestamp in milliseconds
  description: string;
  link: string;
  type: string;
  status: "active" | "closed" | "expired";
  name: string;
  limit: number | null;
  redirectUrl: string | null;
  event: null | unknown;
  order: null | unknown;
  coverImageId: string | null;
  multipleImageId: string | null;
  coverImage: null | unknown;
  multipleImage: null | unknown;
}

// Subscription types (minimal based on current usage)
export interface MayarSubscription {
  id: string;
  customerEmail: string;
  status: "active" | "cancelled" | "expired";
  createdAt: number; // timestamp in milliseconds
}
