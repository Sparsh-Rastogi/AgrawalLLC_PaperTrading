import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { trackA } from "@/lib/track-a";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const cancelled = await trackA.cancelOrder(session.userId, orderId);
    return NextResponse.json(cancelled);
  } catch (error: any) {
    const statusCode = error.status || 400;
    return NextResponse.json(
      { error: error.message || "Failed to cancel order" },
      { status: statusCode }
    );
  }
}
