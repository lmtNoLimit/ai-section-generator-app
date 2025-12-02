/**
 * Seed script for plan configurations
 * Run with: npx tsx prisma/seed-plans.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    planName: "starter",
    displayName: "Starter",
    description: "Perfect for solo merchants and freelancers",
    basePrice: 19.0,
    includedQuota: 50,
    overagePrice: 0.5,
    cappedAmount: 30.0,
    features: [
      "50 AI section generations per month",
      "$0.50 per additional section",
      "Save sections to any theme",
      "Generation history",
      "Section templates",
      "Email support",
    ],
    badge: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    planName: "growth",
    displayName: "Growth",
    description: "Best for small agencies and power users",
    basePrice: 49.0,
    includedQuota: 200,
    overagePrice: 0.4,
    cappedAmount: 100.0,
    features: [
      "200 AI section generations per month",
      "$0.40 per additional section",
      "Everything in Starter",
      "Priority support",
      "Advanced templates",
      "Usage analytics",
    ],
    badge: "Popular",
    sortOrder: 2,
    isActive: true,
  },
  {
    planName: "professional",
    displayName: "Professional",
    description: "For enterprise agencies and SaaS platforms",
    basePrice: 149.0,
    includedQuota: 800,
    overagePrice: 0.3,
    cappedAmount: 300.0,
    features: [
      "800 AI section generations per month",
      "$0.30 per additional section",
      "Everything in Growth",
      "Dedicated support",
      "Custom templates",
      "API access (coming soon)",
      "Priority feature requests",
    ],
    badge: "Best Value",
    sortOrder: 3,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding plan configurations...");

  for (const plan of plans) {
    const result = await prisma.planConfiguration.upsert({
      where: { planName: plan.planName },
      update: plan,
      create: plan,
    });

    console.log(`✓ ${result.displayName} plan: $${result.basePrice}/mo, ${result.includedQuota} sections included`);
  }

  console.log("\nPlan configurations seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Error seeding plans:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
