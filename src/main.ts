import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getPendingOrders } from "./queries/order_queries";
import { sendSlackMessage } from "./slack";

const STALE_ORDER_DAYS = 3;

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, false);

  const staleOrders = await getPendingOrders(db, STALE_ORDER_DAYS);

  if (staleOrders.length > 0) {
    const lines = staleOrders.map(
      (o) =>
        `• Order #${o.order_number} — ${o.customer_name} (${o.phone || "no phone"}) — pending ${o.days_pending} days, $${o.total_amount}`,
    );

    const message = `🚨 *${staleOrders.length} order(s) pending more than ${STALE_ORDER_DAYS} days:*\n${lines.join("\n")}`;

    await sendSlackMessage("#order-alerts", message);
  }
}

main();
