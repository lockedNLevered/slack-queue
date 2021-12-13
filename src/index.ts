require("dotenv").config();
import { App, SlackEventMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import Redis from "ioredis";

interface MessageResponse {
	message: any;
}

type SlackResponse = SlackEventMiddlewareArgs<"message"> &
	AllMiddlewareArgs &
	MessageResponse;

const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	socketMode: true,
	appToken: process.env.SLACK_APP_TOKEN,
});

const redis = new Redis();

app.message(
	"admin",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		const userRes = await client.users.info({ user: message.user });
		if (userRes.user.is_admin) {
			const queue = await redis.zrevrange("myset", 0, -1);
			const users = [];

			for (const value of queue) {
				const user = await client.users.info({ user: value });
				console.log(user);
				users.push(
					user.user.profile.display_name || user.user.profile.real_name
				);
			}

			for (const value of users) {
				await say(value);
			}
		}
	}
);

app.message("add", async ({ message, say }: SlackResponse): Promise<void> => {
	const r = await redis.exists("myset", message.user);
	if (r) {
		const rankRes = await redis.zrank("myset", message.user);
		say(`You are already in the Queue in spot ${rankRes + 1}.`);
		return;
	}

	redis.zadd("myset", Date.now(), message.user);
	await say(`Hello, <@${message.user}>`);
	const rankRes = await redis.zrank("myset", message.user);
	await say(
		`Added <@${message.user}> to Q. You are in spot ${rankRes + 1} :tada:`
	);
});
app.message("where", async ({ message, say }: SlackResponse): Promise<void> => {
	const res = await redis.zrank("myset", message.user);
	//Queue is zero indexed so add one
	const userRank = res + 1;
	if (userRank) {
		say(`You're ${userRank} spots away`);
	} else {
		say("You're not in the Q");
	}
});

app.message(
	"remove",
	async ({ message, say }: SlackResponse): Promise<void> => {
		await redis.zrem("myset", message.user);
		await say(`Removed <@${message.user}> from queue`);
	}
);
(async () => {
	// Start the app
	await app.start(3000);

	console.log("⚡️ Bolt app is running!");
})();
