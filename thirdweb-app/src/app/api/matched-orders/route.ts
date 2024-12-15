// src/app/api/matched_orders/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get("address");

        if (!address) {
            return NextResponse.json({ success: false, error: "Address parameter is required" }, { status: 400 });
        }

        const matchedOrders = await prisma.matchedOrders.findMany({
            where: {
                OR: [
                    { owner: address },
                    { resolver: address },
                ],
            },
        });

        return NextResponse.json({ success: true, matchedOrders });
    } catch (error) {
        console.error("Error fetching matched orders:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch matched orders" }, { status: 500 });
    }
}
