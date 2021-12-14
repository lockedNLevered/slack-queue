require("dotenv").config();
import { App } from "@slack/bolt";
import Redis from "ioredis";
import { isAdmin, getUser, isInQueue } from "./utils/herlpers";
import { SlackResponse } from "./utils/types";

const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	socketMode: true,
	appToken: process.env.SLACK_APP_TOKEN,
});
const QUEUE = process.env.QUEUE;
const redis = new Redis();

app.message(
	"query",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (isAdmin(client, message.user)) {
			const queue = await redis.zrevrange(QUEUE, 0, -1);
			console.log(queue);
			const users = [];
			for (const value of queue) {
				const user = await getUser(client, value);
				//display by display name not @name so we dont notify every user in the queue when an admin queries it
				users.push(
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

app.message(
	"delete",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (isAdmin(client, message.user)) {
			//parse userId from message and remove special chars
			const userId = message.text.split(" ")[2].replace(/[<>@]/g, "");
			await say(`<@${userId}> has been removed from the queue`);
		}
	}
);
app.message(
	"insert",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (isAdmin(client, message.user)) {
			//parse userId from message and remove special chars
			const userId = message.text.split(" ")[2].replace(/[<>@]/g, "");
			redis.zadd(QUEUE, Date.now(), userId);
			await say(`<@${userId}> was added to the queue by <@${message.user}>`);
		}
	}
);

app.message("add", async ({ message, say }: SlackResponse): Promise<void> => {
	if (await isInQueue(redis, QUEUE, message.user)) {
		const rankRes = await redis.zrank(QUEUE, message.user);
		say(`You are already in the Queue in spot ${rankRes + 1}.`);
		return;
	}

	redis.zadd(QUEUE, Date.now(), message.user);
	await say(`Hello, <@${message.user}>`);
	const rankRes = await redis.zrank(QUEUE, message.user);
	await say(
		`Added <@${message.user}> to Q. You are in spot ${rankRes + 1} :tada:`
	);
});
app.message("where", async ({ message, say }: SlackResponse): Promise<void> => {
	if (!(await isInQueue(redis, QUEUE, message.user))) {
		say("You are not in the Q");
		return;
	}
	const res = await redis.zrank(QUEUE, message.user);
	//Queue is zero indexed so add one
	const userRank = res + 1;
	say(`You're ${userRank} spots away`);
});

app.message(
	"remove",
	async ({ message, say }: SlackResponse): Promise<void> => {
		await redis.zrem(QUEUE, message.user);
		await say(`Removed <@${message.user}> from queue`);
	}
);
(async () => {
	// Start the app
	await app.start(3000);

	console.log("⚡️ Bolt app is running!");
})();
