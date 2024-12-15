import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const activeOrders = await prisma.activeOrders.findMany({
            orderBy: { expirationTimestamp: "asc" }, // Sort by expiration time
        });

        return NextResponse.json({ success: true, activeOrders });
    } catch (error) {
        console.error("Error fetching active orders:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch active orders" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { price, amount, expirationTimestamp, owner, deposit } = await req.json();

        // Validate inputs
        if (!price || !amount || !expirationTimestamp || !owner || deposit === undefined) {
            return NextResponse.json({ success: false, error: "All fields are required, including deposit" }, { status: 400 });
        }

        const activeOrder = await prisma.activeOrders.create({
            data: {
                price: parseFloat(price),
                amount: parseInt(amount),
                expirationTimestamp: parseInt(expirationTimestamp),
                owner,
                deposit: parseFloat(deposit),
            },
        });

        return NextResponse.json({ success: true, activeOrder });
    } catch (error) {
        console.error("Error submitting order:", error);
        return NextResponse.json({ success: false, error: "Failed to submit order" }, { status: 500 });
    }
}
