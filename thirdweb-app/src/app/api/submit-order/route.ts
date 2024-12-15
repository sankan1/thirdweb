import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { price, amount, expirationTimestamp, owner } = await req.json();

    // Validate inputs
    if (!price || !amount || !expirationTimestamp || !owner) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    if (isNaN(price) || isNaN(amount) || isNaN(expirationTimestamp)) {
      return NextResponse.json({ success: false, error: "Invalid numeric values" }, { status: 400 });
    }

    const activeOrder = await prisma.activeOrders.create({
      data: {
        price: parseFloat(price),
        amount: parseInt(amount),
        expirationTimestamp: parseInt(expirationTimestamp),
        owner,
      },
    });

    return NextResponse.json({ success: true, activeOrder });
  } catch (error) {
    console.error("Error submitting order:", error);
    return NextResponse.json({ success: false, error: "Failed to submit order" }, { status: 500 });
  }
}
