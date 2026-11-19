import { db } from "./db";
import { events } from "./db/schema";
import { v4 as uuidv4 } from "uuid";

export async function logEvent(
  name: string,
  props: Record<string, any> = {},
  userId?: string
): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000);
    await db.insert(events).values({
      id: uuidv4(),
      userId: userId || null,
      name,
      props: JSON.stringify(props),
      ts: now,
    });
  } catch (err) {
    console.error("Failed to log analytics event:", err);
  }
}
