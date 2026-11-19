import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { trackA } from "@/lib/track-a";
import { OrderRequestSchema } from "@/lib/track-a/schemas";
import { logEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await trackA.getOrderHistory(session.userId);
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const orderData = OrderRequestSchema.parse(body);

    // Check if market is halted
    const market = await trackA.getMarketStatus();
    if (market.status === "halted") {
      return NextResponse.json(
        { error: "Trading halted by exchange. No orders accepted." },
        { status: 400 }
      );
    }

    // Check previous order count for first_order event
    const previousOrders = await trackA.getOrderHistory(session.userId);
    const isFirstOrder = previousOrders.length === 0;

    // Execute order with Track A
    const orderResponse = await trackA.placeOrder(session.userId, orderData);

    // Analytics logging
    if (isFirstOrder) {
      await logEvent("first_order", {
        ticker: orderResponse.ticker,
        side: orderResponse.side,
        status: orderResponse.status,
      }, session.userId);
    }

    await logEvent("order_result", {
      orderId: orderResponse.orderId,
      status: orderResponse.status,
      ticker: orderResponse.ticker,
      side: orderResponse.side,
      quantity: orderResponse.quantity,
      price: orderResponse.price,
    }, session.userId);

    // If filled, dispatch notification
    if (orderResponse.status === "filled") {
      await createNotification({
        userId: session.userId,
        type: "fill",
        title: `Order Filled: ${orderResponse.side.toUpperCase()} ${orderResponse.quantity} ${orderResponse.ticker}`,
        message: `Your ${orderResponse.type} order executed at ₹${(orderResponse.filledPrice || orderResponse.price).toFixed(2)}`,
        payload: { orderId: orderResponse.orderId, ticker: orderResponse.ticker },
        eventId: `fill_${orderResponse.orderId}`,
      });
    }

    return NextResponse.json(orderResponse);
  } catch (error: any) {
    console.error("Order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process order" },
      { status: 400 }
    );
  }
}
