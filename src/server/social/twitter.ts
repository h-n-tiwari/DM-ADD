import { TwitterApi } from "twitter-api-v2";

export async function sendTwitterDM({
    accessToken,
    recipientId,
    message,
    
}: {
    accessToken: string;
    recipientId: string;
    message: string;
}) {
    const client = new TwitterApi(accessToken);

    return await client.v2.sendDmToParticipant(recipientId, {
        text: message,
    })
}