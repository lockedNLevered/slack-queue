import { UsersInfoResponse, WebClient } from "@slack/web-api";

export function getUser(
	client: WebClient,
	userId: string
): Promise<UsersInfoResponse> {
	return client.users.info({ user: userId });
}

export async function isAdmin(
	client: WebClient,
	userId: string
): Promise<boolean> {
	const userRes = await getUser(client, userId);
	return userRes.user.is_admin;
}

export async function isInQueue(redis, queue, userId): Promise<number> {
	return redis.exists(queue, userId);
}
