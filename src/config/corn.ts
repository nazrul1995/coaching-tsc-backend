import cron from "node-cron";
import { evaluateBillingCyclesEngine } from "../controllers/payment.controller";

export const initBillingCron = () => {
  // প্রতিদিন রাত ১২:০০ মিনিটে রান হবে ('0 0 * * *')
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Running daily billing cycle engine...");
    try {
      const newFees = await evaluateBillingCyclesEngine();
      console.log(`[CRON] Automation finished. Created ${newFees} new fee cycles.`);
    } catch (error) {
      console.error("[CRON] Billing engine failed:", error);
    }
  });
};