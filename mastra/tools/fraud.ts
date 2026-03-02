import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Schema for a transaction (matches Mayar API response)
const mayarTransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  product_name: z.string().optional(),
  customer_email: z.string().optional(),
  status: z.string(),
  created_at: z.string(),
});

export const detectFraudTool = createTool({
  id: "detect-fraud",
  description: "Detect potential fraudulent transactions using multiple fraud detection rules (in-memory, no database queries)",
  inputSchema: z.object({
    transactions: z.array(mayarTransactionSchema),
    lookbackDays: z.number().optional().default(7).describe("Number of days to look back for analysis"),
  }),
  execute: async ({ transactions, lookbackDays = 7 }) => {
    const now = new Date();
    const lookbackDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

    // Parse transaction dates and filter by lookback period
    const transactionsWithDates = transactions
      .map((t) => ({
        ...t,
        createdAt: new Date(t.created_at),
      }))
      .filter((t) => t.createdAt >= lookbackDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (transactionsWithDates.length === 0) {
      return {
        fraudDetected: 0,
        suspiciousTransactions: [],
        summary: "No transactions found in the specified period",
      };
    }

    const suspiciousTransactions = [];

    // Calculate statistics for baseline
    const amounts = transactionsWithDates.map((t) => t.amount).filter((a) => a > 0);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);

    // Rule 1: Unusually High Transaction Amount (> 3x average)
    const thresholdHigh = avgAmount * 3;
    const highAmountTxns = transactionsWithDates.filter((t) => t.amount > thresholdHigh);

    for (const txn of highAmountTxns) {
      suspiciousTransactions.push({
        transactionId: txn.id,
        rule: "high_amount",
        severity: "high",
        amount: txn.amount,
        productName: txn.product_name,
        customerEmail: txn.customer_email,
        reason: `Transaction amount (Rp ${txn.amount.toLocaleString("id-ID")}) is ${Math.round(
          txn.amount / avgAmount
        )}x higher than average (Rp ${Math.round(avgAmount).toLocaleString("id-ID")})`,
        timestamp: txn.createdAt,
      });
    }

    // Rule 2: Multiple Transactions from Same Customer in Short Time (Potential card testing)
    const customerTxnMap = new Map<string, typeof transactionsWithDates>();
    transactionsWithDates.forEach((t) => {
      if (t.customer_email) {
        if (!customerTxnMap.has(t.customer_email)) {
          customerTxnMap.set(t.customer_email, []);
        }
        customerTxnMap.get(t.customer_email)!.push(t);
      }
    });

    for (const [email, txns] of customerTxnMap.entries()) {
      if (txns.length > 5) {
        // More than 5 transactions
        const sortedTxns = [...txns].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        let clusteredCount = 0;

        for (let i = 0; i < sortedTxns.length - 1; i++) {
          const timeDiff = sortedTxns[i + 1].createdAt.getTime() - sortedTxns[i].createdAt.getTime();
          if (timeDiff < 5 * 60 * 1000) {
            // Within 5 minutes
            clusteredCount++;
          }
        }

        if (clusteredCount >= 3 && sortedTxns.length > 0) {
          suspiciousTransactions.push({
            transactionId: sortedTxns[sortedTxns.length - 1].id,
            rule: "high_velocity",
            severity: "high",
            amount: sortedTxns.reduce((sum, t) => sum + t.amount, 0),
            customerEmail: email,
            reason: `${txns.length} transactions from same customer in short period (potential card testing)`,
            timestamp: sortedTxns[sortedTxns.length - 1].createdAt,
          });
        }
      }
    }

    // Rule 3: Round Number Transactions (Potential fraud - fraudsters often use round numbers)
    const roundNumberThreshold = 10000;
    const roundNumberTxns = transactionsWithDates.filter((t) => {
      if (t.amount >= roundNumberThreshold) {
        return (
          t.amount % 10000 === 0 || t.amount % 50000 === 0 || t.amount % 100000 === 0
        );
      }
      return false;
    });

    for (const txn of roundNumberTxns) {
      suspiciousTransactions.push({
        transactionId: txn.id,
        rule: "round_number",
        severity: "low",
        amount: txn.amount,
        productName: txn.product_name,
        customerEmail: txn.customer_email,
        reason: `Transaction is a suspicious round number (Rp ${txn.amount.toLocaleString("id-ID")})`,
        timestamp: txn.createdAt,
      });
    }

    // Rule 4: Repeated Same Amount from Different Customers (Potential organized fraud)
    const amountCountMap = new Map<number, number>();
    const amountTxnMap = new Map<number, typeof transactionsWithDates>();

    for (const txn of transactionsWithDates) {
      const key = txn.amount;
      amountCountMap.set(key, (amountCountMap.get(key) || 0) + 1);
      if (!amountTxnMap.has(key)) {
        amountTxnMap.set(key, []);
      }
      amountTxnMap.get(key)!.push(txn);
    }

    for (const [amount, count] of amountCountMap.entries()) {
      if (count >= 3 && amount > 50000) {
        // Same amount 3+ times, over 50k
        const txnsForAmount = amountTxnMap.get(amount)!;
        const uniqueCustomers = new Set(txnsForAmount.map((t) => t.customer_email)).size;

        if (uniqueCustomers >= 2) {
          // Different customers
          suspiciousTransactions.push({
            transactionId: txnsForAmount[0].id,
            rule: "repeated_amount",
            severity: "medium",
            amount: amount,
            reason: `Same amount (Rp ${amount.toLocaleString("id-ID")}) used ${count} times by ${uniqueCustomers} different customers (potential coordinated fraud)`,
            timestamp: txnsForAmount[0].createdAt,
          });
        }
      }
    }

    // Rule 5: Unusual Timing Pattern (Transactions at odd hours)
    // Late night transactions (2 AM - 5 AM) with high amounts
    const lateNightTxns = transactionsWithDates.filter((t) => {
      const hour = t.createdAt.getHours();
      return hour >= 2 && hour <= 5 && t.amount > avgAmount;
    });

    for (const txn of lateNightTxns) {
      suspiciousTransactions.push({
        transactionId: txn.id,
        rule: "unusual_timing",
        severity: "medium",
        amount: txn.amount,
        productName: txn.product_name,
        customerEmail: txn.customer_email,
        reason: `High-value transaction (Rp ${txn.amount.toLocaleString("id-ID")}) at unusual hour (${txn.createdAt.getHours()}:00)`,
        timestamp: txn.createdAt,
      });
    }

    // Rule 6: First Transaction is Unusually High (New customer with high first purchase)
    for (const [email, txns] of customerTxnMap.entries()) {
      if (txns.length === 1 && txns[0].amount > avgAmount * 2) {
        suspiciousTransactions.push({
          transactionId: txns[0].id,
          rule: "high_first_transaction",
          severity: "medium",
          amount: txns[0].amount,
          customerEmail: email,
          reason: `First transaction from new customer is unusually high (Rp ${txns[0].amount.toLocaleString(
            "id-ID"
          )}, ${Math.round(txns[0].amount / avgAmount)}x average)`,
          timestamp: txns[0].createdAt,
        });
      }
    }

    // Build summary
    const severityCount = {
      high: suspiciousTransactions.filter((t) => t.severity === "high").length,
      medium: suspiciousTransactions.filter((t) => t.severity === "medium").length,
      low: suspiciousTransactions.filter((t) => t.severity === "low").length,
    };

    const summary = `Analyzed ${transactionsWithDates.length} transactions from the last ${lookbackDays} days. Found ${suspiciousTransactions.length} suspicious activities: ${severityCount.high} high, ${severityCount.medium} medium, ${severityCount.low} low severity.`;

    return {
      fraudDetected: suspiciousTransactions.length,
      suspiciousTransactions,
      summary,
      statistics: {
        totalTransactions: transactionsWithDates.length,
        averageAmount: Math.round(avgAmount),
        maxAmount,
        minAmount,
      },
    };
  },
});
