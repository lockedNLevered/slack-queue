import { UsersInfoResponse, WebClient } from "@slack/web-api";
import { Redis } from "ioredis";
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
	return userRes.user!.is_admin!;
}

export async function isInQueue(
	redis: Redis,
	queue: string,
	userId: string
): Promise<number> {
	return redis.exists(queue, userId);
}

export async function rank(
	queue: string,
	redis: Redis,
	userId: string
): Promise<number> {
	return redis.zrank(queue, userId) as never as number;
}

export function buildMessage(isAdmin: boolean, user: string) {
	if (isAdmin) {
		return {
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `Hello <@${user}>! I see that you are an admin. Below is a list of commands:`,
					},
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: "*Admin only commands:*",
						},
					],
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: "*query*\nSee everybody in the queue :sparkles:",
						},
					],
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: "*insert*\nAdds a user to the queue :sparkles:\n*@MentionBot insert @user_to_add*",
						},
					],
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: "*delete*\nRemoves a user from the queue :sparkles:\n*@MentionBot delete @user_to_remove*",
						},
					],
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: "*Generic commands:*",
						},
					],
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: "*add*\nAdd yourself to the queue :rocket:",
						},
					],
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: "*remove*\nRemove yourself from the queue :wave:",
						},
					],
				},
				{
					type: "section",
					fields: [
						{
							type: "mrkdwn",
							text: "*where*\nCheck your spot in the queue :crystal_ball:",
						},
					],
				},
			],
		};
	} else {
		return {
			blocks: [
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: "Hello! Below you will find a list of commands you can use:",
					},
				},

				{
					type: "section",
					block_id: "section789",
					fields: [
						{
							type: "mrkdwn",
							text: "*add*\nAdd yourself to the queue :rocket:",
						},
					],
				},
				{
					type: "section",
					block_id: "section790",
					fields: [
						{
							type: "mrkdwn",
							text: "*remove*\nRemove yourself from the queue :wave:",
						},
					],
				},
				{
					type: "section",
					block_id: "section791",
					fields: [
						{
							type: "mrkdwn",
							text: "*where*\nCheck your spot in the queue :crystal_ball:",
						},
					],
				},
			],
		};
	}
}
