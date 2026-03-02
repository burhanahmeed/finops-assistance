import type {
  MayarTransaction,
  MayarInvoice,
  MayarProduct,
  MayarSubscription,
  MayarUnpaidTransaction,
} from "@/types/mayar";

const PRODUCT_NAMES = [
  "Template IG Pack",
  "Ebook Marketing",
  "Konsultasi 1 Jam",
  "Paket Premium",
];

const CUSTOMER_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "example.com"];

const PAYMENT_METHODS = ["QRIS", "VIRTUAL_ACCOUNT", "EWALLET", "RETAIL_OUTLET"];

const BALANCE_HISTORY_TYPES = ["bundling", "direct", "subscription", "invoice"];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTimestamp(daysAgo: number): number {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  return now - randomInt(0, daysAgo) * oneDay;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateCustomerId(): string {
  return generateUUID();
}

function generateCustomer(id: string) {
  const domains = CUSTOMER_DOMAINS;
  const customerNum = randomInt(1, 500);
  return {
    id,
    name: `Customer ${customerNum}`,
    email: `customer${customerNum}@${randomItem(domains)}`,
    mobile: `08${randomInt(100000000, 999999999)}`,
  };
}

function generatePaymentLink(id: string, name: string) {
  return {
    id,
    name,
  };
}

function generateFee(): any[] {
  const fees = [];
  const credit = randomInt(50000, 500000);
  const mayarFee = Math.round(credit * 0.01); // 1%
  const xenditFee = Math.round(credit * 0.0063); // 0.63%

  if (mayarFee > 0) {
    fees.push({
      id: generateUUID(),
      balanceHistoryType: "mayar_fee",
      debit: mayarFee,
    });
  }

  if (xenditFee > 0) {
    fees.push({
      id: generateUUID(),
      balanceHistoryType: "xendit_fee",
      debit: xenditFee,
    });
  }

  return fees;
}

/**
 * Generate 50 mock transactions with realistic amounts and dates
 */
export function generateMockTransactions(): MayarTransaction[] {
  const transactions: MayarTransaction[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Generate transactions over the past 90 days
  for (let i = 90; i > 0; i--) {
    const dailyCount = randomInt(0, 5); // 0-5 transactions per day

    for (let j = 0; j < dailyCount; j++) {
      const credit = randomInt(50000, 500000); // 50k - 500k
      const productName = randomItem(PRODUCT_NAMES);
      const customerId = generateCustomerId();
      const transactionId = generateUUID();
      const paymentLinkId = generateUUID();
      const xenditTransactionId = generateUUID();
      const createdAt = now - i * oneDay - randomInt(0, 23 * 60 * 60 * 1000);

      const customer = generateCustomer(customerId);
      const paymentLink = generatePaymentLink(paymentLinkId, productName);
      const fees = generateFee();

      transactions.push({
        id: transactionId,
        credit,
        status: "settled",
        balanceHistoryType: randomItem(BALANCE_HISTORY_TYPES),
        paymentMethod: randomItem(PAYMENT_METHODS),
        customerId,
        createdAt,
        paymentLinkTransactionId: generateUUID(),
        fee: fees,
        paymentLinkId,
        subscriptionId: null,
        xenditTransactionId,
        subscription: null,
        paymentLinkTransaction: {
          id: generateUUID(),
          isAdminFeeBorneByCustomer: false,
          isChannelFeeBorneByCustomer: false,
        },
        customer,
        paymentLink,
        xenditTransaction: {
          id: xenditTransactionId,
          paymentLinkTransactionId: generateUUID(),
          paymentLinkTransaction: {
            id: generateUUID(),
            couponUsage: null,
          },
        },
      });
    }
  }

  // Ensure at least 50 transactions
  while (transactions.length < 50) {
    const credit = randomInt(50000, 500000);
    const productName = randomItem(PRODUCT_NAMES);
    const customerId = generateCustomerId();
    const transactionId = generateUUID();
    const paymentLinkId = generateUUID();
    const xenditTransactionId = generateUUID();
    const createdAt = randomTimestamp(30);

    const customer = generateCustomer(customerId);
    const paymentLink = generatePaymentLink(paymentLinkId, productName);
    const fees = generateFee();

    transactions.push({
      id: transactionId,
      credit,
      status: "settled",
      balanceHistoryType: randomItem(BALANCE_HISTORY_TYPES),
      paymentMethod: randomItem(PAYMENT_METHODS),
      customerId,
      createdAt,
      paymentLinkTransactionId: generateUUID(),
      fee: fees,
      paymentLinkId,
      subscriptionId: null,
      xenditTransactionId,
      subscription: null,
      paymentLinkTransaction: {
        id: generateUUID(),
        isAdminFeeBorneByCustomer: false,
        isChannelFeeBorneByCustomer: false,
      },
      customer,
      paymentLink,
      xenditTransaction: {
        id: xenditTransactionId,
        paymentLinkTransactionId: generateUUID(),
        paymentLinkTransaction: {
          id: generateUUID(),
          couponUsage: null,
        },
      },
    });
  }

  // Sort by date descending (newest first)
  return transactions.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Generate 20 mock unpaid transactions
 */
export function generateMockUnpaidTransactions(): MayarUnpaidTransaction[] {
  const unpaid: MayarUnpaidTransaction[] = [];
  const statuses: Array<"active" | "expired" | "paid"> = ["active", "active", "active", "expired", "paid"];

  for (let i = 0; i < 20; i++) {
    const amount = randomInt(100000, 1000000);
    const customerId = generateCustomerId();
    const createdAt = randomTimestamp(60);
    const customer = generateCustomer(customerId);
    const paymentLinkId = generateUUID();

    unpaid.push({
      id: generateUUID(),
      createdAt,
      type: "invoice",
      amount,
      status: randomItem(statuses),
      customerId,
      paymentLinkId,
      customer,
      paymentLink: {},
      paymentUrl: `https://example.mayar.shop/plt/${generateUUID()}`,
    });
  }

  return unpaid.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Generate 20 mock invoices with due dates
 */
export function generateMockInvoices(): MayarInvoice[] {
  const invoices: MayarInvoice[] = [];
  const statuses: Array<"paid" | "unpaid" | "expired"> = ["paid", "paid", "unpaid", "unpaid", "expired"];

  for (let i = 0; i < 20; i++) {
    const createdAt = randomTimestamp(60);
    const amount = randomInt(100000, 1000000); // 100k - 1M
    const customerId = generateCustomerId();
    const customer = generateCustomer(customerId);

    invoices.push({
      id: generateUUID(),
      amount,
      status: randomItem(statuses),
      category: null,
      createdAt,
      description: `Invoice for product/service`,
      link: Math.random().toString(36).substring(2, 11),
      type: "invoice",
      name: `INV-${randomInt(1000, 9999)}`,
      redirectUrl: null,
      customerId,
      transactions: [],
      customer,
    });
  }

  return invoices.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Generate 4 predefined mock products
 */
export function generateMockProducts(): MayarProduct[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  return [
    {
      id: generateUUID(),
      amount: 99000,
      category: "Digital",
      createdAt: now - 90 * oneDay,
      description: "Template Instagram siap pakai untuk bisnis Anda",
      link: "template-ig-pack",
      type: "digital_product",
      status: "active",
      name: "Template IG Pack",
      limit: null,
      redirectUrl: null,
      event: null,
      order: null,
      coverImageId: null,
      multipleImageId: null,
      coverImage: null,
      multipleImage: null,
    },
    {
      id: generateUUID(),
      amount: 149000,
      category: "Ebook",
      createdAt: now - 85 * oneDay,
      description: "Ebook panduan marketing digital lengkap",
      link: "ebook-marketing",
      type: "ebook",
      status: "active",
      name: "Ebook Marketing",
      limit: null,
      redirectUrl: null,
      event: null,
      order: null,
      coverImageId: null,
      multipleImageId: null,
      coverImage: null,
      multipleImage: null,
    },
    {
      id: generateUUID(),
      amount: 250000,
      category: "Service",
      createdAt: now - 80 * oneDay,
      description: "Konsultasi bisnis selama 1 jam via Zoom",
      link: "konsultasi-1-jam",
      type: "digital_product",
      status: "active",
      name: "Konsultasi 1 Jam",
      limit: null,
      redirectUrl: null,
      event: null,
      order: null,
      coverImageId: null,
      multipleImageId: null,
      coverImage: null,
      multipleImage: null,
    },
    {
      id: generateUUID(),
      amount: 499000,
      category: "Premium",
      createdAt: now - 75 * oneDay,
      description: "Akses premium ke semua konten dan fitur eksklusif",
      link: "paket-premium",
      type: "digital_product",
      status: "active",
      name: "Paket Premium",
      limit: null,
      redirectUrl: null,
      event: null,
      order: null,
      coverImageId: null,
      multipleImageId: null,
      coverImage: null,
      multipleImage: null,
    },
  ];
}

/**
 * Generate 3 mock subscriptions
 */
export function generateMockSubscriptions(): MayarSubscription[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  return [
    {
      id: generateUUID(),
      customerEmail: "premium.user1@gmail.com",
      status: "active",
      createdAt: now - 60 * oneDay,
    },
    {
      id: generateUUID(),
      customerEmail: "premium.user2@yahoo.com",
      status: "active",
      createdAt: now - 45 * oneDay,
    },
    {
      id: generateUUID(),
      customerEmail: "former.user@gmail.com",
      status: "cancelled",
      createdAt: now - 90 * oneDay,
    },
  ];
}
