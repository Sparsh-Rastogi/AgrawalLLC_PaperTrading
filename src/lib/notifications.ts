import { db } from "./db";
import { notifications } from "./db/schema";
import { v4 as uuidv4 } from "uuid";
import { eq, and, sql } from "drizzle-orm";

export interface CreateNotificationParams {
  userId: string;
  type: "fill" | "call_scored" | "followed_trade" | "league_invite" | "system";
  title: string;
  message: string;
  payload?: Record<string, any>;
  eventId?: string; // For de-duplication
}

export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const payloadWithMeta = {
      ...(params.payload || {}),
      eventId: params.eventId || uuidv4(),
    };

    // De-duplication check: if eventId already delivered to this user, skip
    if (params.eventId) {
      const existing = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, params.userId),
            sql`json_extract(payload, '$.eventId') = ${params.eventId}`
          )
        )
        .get();

      if (existing) {
        return false;
      }
    }

    const now = Math.floor(Date.now() / 1000);
    await db.insert(notifications).values({
      id: uuidv4(),
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      payload: JSON.stringify(payloadWithMeta),
      readAt: null,
      createdAt: now,
    });

    return true;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return false;
  }
}
