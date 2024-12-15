import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { price, amount, expirationTimestamp, owner, resolver, deposit } = await req.json();

        // Create a new matched order in the database
        const matchedOrder = await prisma.matchedOrders.create({
            data: {
                price,
                amount,
                expirationTimestamp,
                owner,
                resolver,
                deposit,
            },
        });

        // Remove the active order from the database
        await prisma.activeOrders.delete({
            where: { id: matchedOrder.id },
        });

        return NextResponse.json({ success: true, matchedOrder });
    } catch (error) {
        console.error("Error matching order:", error);
        return NextResponse.json({ success: false, error: "Failed to match order" }, { status: 500 });
    }
}
