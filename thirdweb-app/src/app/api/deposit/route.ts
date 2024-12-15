import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        // Extract the Authorization header
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const signature = authHeader.split(" ")[1];
        const { address, amount } = await req.json();

        // Verify the signature
        const message = "Authorize deposit request";
        const recoveredAddress = ethers.utils.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
        }

        // Insert the deposit record into the database
        const deposit = await prisma.deposit.create({
            data: {
                address,
                amount: parseFloat(amount),
            },
        });

        return NextResponse.json({ success: true, deposit });
    } catch (error) {
        console.error("Error inserting deposit:", error);
        return NextResponse.json({ success: false, error: "Failed to insert deposit" }, { status: 500 });
    }
}


export async function CREATE_MATCHED_ORDER(req: Request) {
    try {
        const { price, amount, expirationTimestamp, owner, resolver, deposit } = await req.json();

        const matchedOrder = await prisma.matchedOrders.create({
            data: {
                price,
                amount,
                expirationTimestamp,
                owner,
                resolver,
                deposit
            },
        });

        return NextResponse.json({ success: true, matchedOrder });
    } catch (error) {
        console.error("Error matching order:", error);
        return NextResponse.json({ success: false, error: "Failed to match order" }, { status: 500 });
    }
}

export async function GET_ACTIVE_ORDERS() {
    try {
        const activeOrders = await prisma.activeOrders.findMany();

        return NextResponse.json({ success: true, activeOrders });
    } catch (error) {
        console.error("Error fetching active orders:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch active orders" }, { status: 500 });
    }
}

export async function POST_ACTIVE_ORDER(req: Request) {
    try {
        const { price, amount, expirationTimestamp, owner } = await req.json();

        const activeOrder = await prisma.activeOrders.create({
            data: {
                price,
                amount,
                expirationTimestamp,
                owner,
            },
        });

        return NextResponse.json({ success: true, activeOrder });
    } catch (error) {
        console.error("Error submitting order:", error);
        return NextResponse.json({ success: false, error: "Failed to submit order" }, { status: 500 });
    }
}

export async function GET_OWNER_MATCHED_ORDERS(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const owner = searchParams.get("owner");
        const resolver = searchParams.get("resolver");

        const whereClause: any = {};

        if (owner) whereClause.owner = owner;
        if (resolver) whereClause.resolver = resolver;

        const matchedOrders = await prisma.matchedOrders.findMany({
            where: whereClause,
        });

        return NextResponse.json({ success: true, matchedOrders });
    } catch (error) {
        console.error("Error fetching matched orders:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch matched orders" }, { status: 500 });
    }
}




// POST - matchOrder ostukäru nupp
// GET - active orders
// POST - submit order, create ActiveOrder
// GET - filtered Match(ed)Orders


