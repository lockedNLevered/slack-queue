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
	redis.zadd("myset", Date.now(), message.user);
	await say(`Hello, <@${message.user}>`);
	redis
		.zrevrange("myset", 0, -1)
		.then((res) =>
			redis
				.zrank("myset", message.user)
				.then((res) =>
					say(
						`Added <@${message.user}> to Q. You are in spot ${res + 1} :tada:`
					)
				)
		);
});
app.message("where", async ({ message, say }: any) => {
	redis.zrank("myset", message.user).then((res) => {
		res++;
		if (res) {
			say(`You're ${res} spots away`);
		} else {
			say("You're not in the Q");
		}
	});
});

app.message("remove", async ({ message, say }: any) => {
	redis
		.zrem("myset", message.user)
		.then(() => say(`Removed <@${message.user}> from queue`));
});
(async () => {
	// Start the app
	await app.start(3000);

	console.log("⚡️ Bolt app is running!");
})();
