import { createHmac } from "node:crypto";
import { prisma } from "@/server/prisma";
import { sendTwitterDM } from "@/server/social/twitter";
import { NextResponse } from "next/server";

type TwitterTweetEvent = {
  user?: {
    id_str?: string;
  };
  text?: string;
};

type TwitterWebhookBody = {
  tweet_create_events?: TwitterTweetEvent[];
};

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const crcToken = searchParams.get("crc_token");

  if (!crcToken) {
    return NextResponse.json(
      { error: "Missing CRC token" },
      { status: 400 }
    );
  }

  const secret = process.env.TWITTER_CLIENT_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Twitter secret is not configured" },
      { status: 500 }
    );
  }

  const hash = createHmac("sha256", secret)
    .update(crcToken)
    .digest("base64");

  return NextResponse.json({
    response_token: `sha256=${hash}`,
  });
}

export async function POST(req: Request): Promise<Response> {
  const body: TwitterWebhookBody = await req.json();
  const events = body.tweet_create_events ?? [];

  for (const event of events) {
    const authorId = event.user?.id_str;
    const tweetText = event.text ?? "";

    if (!authorId) continue;

    const automations = await prisma.automation.findMany({
      where: {
        platform: "twitter",
        isActive: true,
      },
      include: {
        user: {
          include: {
            accounts: true,
          },
        },
      },
    });

    for (const automation of automations) {
      const matchesTrigger = tweetText
        .toLowerCase()
        .includes(automation.trigger.toLowerCase());

      if (!matchesTrigger) continue;

      const twitterAccount = automation.user.accounts.find(
        (account) => account.providerId === "twitter"
      );

      if (!twitterAccount?.accessToken) continue;

      await sendTwitterDM({
        accessToken: twitterAccount.accessToken,
        recipientId: authorId,
        message: automation.dmMessage,
      });
    }
  }

  return NextResponse.json({ ok: true });
}