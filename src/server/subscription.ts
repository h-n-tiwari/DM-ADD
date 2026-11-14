import { prisma } from "@/server/prisma";

export const  FREE_AUTOMATION_LIMIT = 5;

export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
    const subscription = await prisma.subscription.findUnique({
        where: {userId},
    });

    if (!subscription || subscription.plan !== "pro") {
        return "free";
    };

    if (subscription.expiresAt && subscription.expiresAt <= new Date()) {
        return "free";
    };

    return "pro";

}