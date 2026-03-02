import { db } from "../db";
import { transactions } from "../db/schema";

async function seed() {
  console.log("Seeding database with demo data...");

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Generate 3 months of transaction data
  const demoTransactions = [];

  // Last 2 months - healthy sales
  for (let i = 90; i > 14; i--) {
    const date = new Date(now - i * oneDay);
    const dailyTransactions = Math.floor(Math.random() * 5) + 3; // 3-7 transactions per day

    for (let j = 0; j < dailyTransactions; j++) {
      demoTransactions.push({
        id: `txn_${i}_${j}_${Date.now()}`,
        amount: Math.floor(Math.random() * 500000) + 50000, // 50k - 550k
        productName: ["Template IG Pack", "Ebook Marketing", "Konsultasi 1 Jam", "Paket Premium"][
          Math.floor(Math.random() * 4)
        ],
        customerEmail: `customer${Math.floor(Math.random() * 50)}@example.com`,
        status: "paid",
        createdAt: date,
      });
    }
  }

  // Last 2 weeks - revenue drop scenario
  for (let i = 14; i > 0; i--) {
    const date = new Date(now - i * oneDay);
    const dailyTransactions = Math.floor(Math.random() * 2) + 1; // Only 1-2 transactions per day

    for (let j = 0; j < dailyTransactions; j++) {
      demoTransactions.push({
        id: `txn_recent_${i}_${j}_${Date.now()}`,
        amount: Math.floor(Math.random() * 300000) + 30000, // Lower amounts
        productName: ["Ebook Marketing", "Konsultasi 1 Jam"][Math.floor(Math.random() * 2)],
        customerEmail: `customer${Math.floor(Math.random() * 50)}@example.com`,
        status: "paid",
        createdAt: date,
      });
    }
  }

  // Insert all transactions
  for (const txn of demoTransactions) {
    await db.insert(transactions).values(txn).onConflictDoNothing();
  }

  console.log(`✓ Seeded ${demoTransactions.length} transactions`);
  console.log("✓ Scenario: Revenue drop in last 2 weeks");
  console.log("✓ Scenario: 'Template IG Pack' has no sales in last 2 weeks");
}

seed()
  .then(() => {
    console.log("Seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
