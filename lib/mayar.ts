import type { MayarTransaction, MayarInvoice, MayarProduct, MayarSubscription } from "@/types/mayar";
import {
  generateMockTransactions,
  generateMockInvoices,
  generateMockProducts,
  generateMockSubscriptions,
} from "./mayar-mock";

const MAYAR_BASE_URL = "https://api.mayar.id/hl/v1";

export class MayarClient {
  private apiKey: string;
  private useMockData: boolean;

  constructor(apiKey: string, useMockData = false) {
    this.apiKey = apiKey;
    this.useMockData = useMockData;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${MAYAR_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Mayar API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getTransactions(page = 1, limit = 100): Promise<MayarTransaction[]> {
    if (this.useMockData) {
      const mockData = generateMockTransactions();
      const start = (page - 1) * limit;
      const end = start + limit;
      return mockData.slice(start, end);
    }

    const data = await this.request<{ data: MayarTransaction[] }>(
      `/transaction?page=${page}&limit=${limit}`
    );
    return data.data || [];
  }

  async getInvoices(page = 1, limit = 100): Promise<MayarInvoice[]> {
    if (this.useMockData) {
      const mockData = generateMockInvoices();
      const start = (page - 1) * limit;
      const end = start + limit;
      return mockData.slice(start, end);
    }

    const data = await this.request<{ data: MayarInvoice[] }>(
      `/invoice?page=${page}&limit=${limit}`
    );
    return data.data || [];
  }

  async getProducts(): Promise<MayarProduct[]> {
    if (this.useMockData) {
      return generateMockProducts();
    }

    const data = await this.request<{ data: MayarProduct[] }>("/payment-link");
    return data.data || [];
  }

  async getSubscriptions(): Promise<MayarSubscription[]> {
    if (this.useMockData) {
      return generateMockSubscriptions();
    }

    const data = await this.request<{ data: MayarSubscription[] }>("/subscription");
    return data.data || [];
  }
}

/**
 * Factory function to create a MayarClient instance
 * @param apiKey - Mayar API key
 * @param useMockData - Whether to use mock data instead of real API calls
 */
export function createMayarClient(apiKey: string, useMockData = false): MayarClient {
  return new MayarClient(apiKey, useMockData);
}

// Legacy export for backward compatibility
export const mayarClient = new MayarClient(process.env.MAYAR_API_KEY || "");
