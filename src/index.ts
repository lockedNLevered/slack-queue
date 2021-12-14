require("dotenv").config();
import { App } from "@slack/bolt";
import Redis from "ioredis";
import { isAdmin, getUser, isInQueue, rank } from "./utils/helpers";
import { SlackResponse } from "./utils/types";
const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	socketMode: true,
	appToken: process.env.SLACK_APP_TOKEN,
});
const QUEUE = process.env.QUEUE as string;
const redis = new Redis();

//documentation function explaining commands
app.message(
	"help",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (await isAdmin(client, message.user)) {
			await say({
				blocks: [
					{
						type: "section",
						text: {
							type: "mrkdwn",
							text: `Hello <@${message.user}>! I see that you are an admin. Below is a list of commands:`,
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
			});
			return;
		}

		await say({
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
		});
		return;
	}
);
//ADMIN -> displays users in the Queue with their human readable index
app.message(
	"query",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (await isAdmin(client, message.user)) {
			const queue = await redis.zrevrange(QUEUE, 0, -1);
			console.log(queue);
			const users = [];
			for (const value of queue) {
				const user = await getUser(client, value);
				//display by display name not @name so we dont notify every user in the queue when an admin queries it
				users.push(
					//@ts-ignore
					user.user.profile.display_name || user.user.profile.real_name
				);
			}
			users.reverse();
			for (const index in users) {
				await say(`${parseInt(index) + 1}. ${users[index]}`);
			}
		}
	}
);
//ADMIN -> deletes a user by name from the queue
app.message(
	"delete",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (await isAdmin(client, message.user)) {
			//parse userId from message and remove special chars
			const userId = message.text.split(" ")[2].replace(/[<>@]/g, "");
			await say(`<@${userId}> has been removed from the queue`);
		}
	}
);
//ADMIN -> inserts a user by name into the queue
app.message(
	"insert",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (await isAdmin(client, message.user)) {
			//parse userId from message and remove special chars
			const userId = message.text.split(" ")[2].replace(/[<>@]/g, "");
			redis.zadd(QUEUE, Date.now(), userId);
			await say(`<@${userId}> was added to the queue by <@${message.user}>`);
		}
	}
);
//adds the sender into the queue
app.message("add", async ({ message, say }: SlackResponse): Promise<void> => {
	if (await isInQueue(redis, QUEUE, message.user)) {
		const rankRes = await rank(QUEUE, redis, message.user);
		say(`You are already in the Queue in spot ${rankRes + 1}.`);
		return;
	}

	redis.zadd(QUEUE, Date.now(), message.user);
	await say(`Hello, <@${message.user}>`);
	const rankRes = await rank(QUEUE, redis, message.user);
	await say(
		`Added <@${message.user}> to Q. You are in spot ${rankRes + 1} :tada:`
	);
});
//displays the senders current position in the queue or notifies them they are not in the queue
app.message("where", async ({ message, say }: SlackResponse): Promise<void> => {
	if (!(await isInQueue(redis, QUEUE, message.user))) {
		say("You are not in the Q");
		return;
	}
	const rankRes = await rank(QUEUE, redis, message.user);
	//Queue is zero indexed so add one
	const userRank = rankRes + 1;
	say(`You're ${userRank} spots away`);
});
//removes the sender form the queue
app.message(
	"remove",
	async ({ message, say }: SlackResponse): Promise<void> => {
		await redis.zrem(QUEUE, message.user);
		await say(`Removed <@${message.user}> from queue`);
	}
);
(async () => {
	await app.start(3000);

	console.log("app is running!");
})();
