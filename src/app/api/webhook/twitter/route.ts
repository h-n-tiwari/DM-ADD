import { prisma } from "@/lib/prisma";
import { sendTwitterDM } from "@/server/social/twitter";
import { asyncWrapProviders } from "async_hooks";
import { any } from "better-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const crcToken = searchParams.get("crc_token");

    if (!crcToken) {
        return NextResponse.json({ error: "NO CRC" }, { status: 400 });
    };

    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", process.env.TWITTER_CLIENT_SECRET!);
    hmac.update(crcToken);
    const hash = "sha256" + hmac.digest("base64");

    return NextResponse.json({ response_token: hash });
    
}

export async function POST(req: Request) {
    const body = await req.json();
    const events = body.tweet_client_events ?? [];

    for (const event of events) {
        const authorId = event.user?.id_str;
        const tweetText: string = event.text ?? "";

       if (!authorId) continue;

       const automations = await prisma.automation.findMany({
        where: { platform: "twitter", isActive: true },
        include: { user: { include: { accounts: true } } },
       });

       for (const automation of automations) {
        if (tweetText.toLowerCase().includes(automation.trigger.toLowerCase())) {
            const twitterAccount = automation.user.accounts.find(
                (a) => a.providerId === "twitter"
            );

            if (!twitterAccount?.accessToken) continue;

            await sendTwitterDM({
                accessToken: twitterAccount.accessToken,
                recipientId: authorId,
                message: automation.dmMessage,
            });
        }
       }
    } 
    return NextResponse.json({ ok: true });
}