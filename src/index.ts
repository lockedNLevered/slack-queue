require("dotenv").config();
import { App } from "@slack/bolt";
import Redis from "ioredis";

const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	socketMode: true,
	appToken: process.env.SLACK_APP_TOKEN,
});

const redis = new Redis();

/* Add functionality here */
app.message("add", async ({ message, say }: any) => {
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
app.message("where", async ({ message, say }: any) => {
	const res = await redis.zrank("myset", message.user);
	//Queue is zero indexed so add one
	const userRank = res + 1;
	if (userRank) {
		say(`You're ${userRank} spots away`);
	} else {
		say("You're not in the Q");
	}
});

app.message("remove", async ({ message, say }: any) => {
	await redis.zrem("myset", message.user);
	await say(`Removed <@${message.user}> from queue`);
});
(async () => {
	// Start the app
	await app.start(3000);

	console.log("⚡️ Bolt app is running!");
})();
