import { withAuth } from "@/server/utils/with-auth";
import { prisma } from "@/server/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getUserPlan, FREE_AUTOMATION_LIMIT } from "@/server/subscription";

type CreateAutomationBody = Pick<
  Prisma.AutomationCreateInput,
  "name" | "platform" | "trigger" | "dmMessage"
>;

export const GET = withAuth(
  async (_req, session): Promise<Response> => {
    const automations = await prisma.automation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(automations);
  }
);

export const POST = withAuth(
  async (req, session): Promise<Response> => {
    // const subscription = await prisma.subscription.findUnique({
    //   where: { userId: session.user.id },
    // });

    // const isPro =
    //   subscription?.plan === "pro" &&
    //   (!subscription.expiresAt || subscription.expiresAt > new Date());

    // if (!isPro) {
    //   const count = await prisma.automation.count({
    //     where: { userId: session.user.id },
    //   });

    //   if (count >= 5) {
    //     return NextResponse.json(
    //       { error: "Free tier limit: 5 automations max. Upgrade to pro." },
    //       { status: 403 }
    //     );
    //   }
    // }

    const plan = await getUserPlan(session.user.id);

    if (plan === "free") {
      const count = await prisma.automation.count({ where: { userId: session.user.id } });

      if (count >= FREE_AUTOMATION_LIMIT) {
        return NextResponse.json({ error: "..." }, { status: 403 });
      }
      
    }

    const body: Partial<CreateAutomationBody> = await req.json();
    const { name, platform, trigger, dmMessage } = body;

    if (!name || !platform || !trigger || !dmMessage) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "twitter" },
  });

  if (!account?.accessToken) {
    return NextResponse.json({ error: "Twitter account not connected" }, { status: 400 });
  }

    const automation = await prisma.automation.create({
      data: {
        userId: session.user.id,
        name,
        platform,
        trigger,
        dmMessage,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  }
);

export const DELETE = withAuth(
  async (req, session): Promise<Response> => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation || automation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not Found" },
        { status: 404 }
      );
    }

    await prisma.automation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  }
);