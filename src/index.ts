require("dotenv").config();
import { App, SlackEventMiddlewareArgs, AllMiddlewareArgs } from "@slack/bolt";
import { UsersInfoResponse, WebClient } from "@slack/web-api";
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

function getUser(
	client: WebClient,
	userId: string
): Promise<UsersInfoResponse> {
	return client.users.info({ user: userId });
}

async function isAdmin(client: WebClient, userId: string): Promise<boolean> {
	const userRes = await getUser(client, userId);
	return userRes.user.is_admin;
}

app.message(
	"admin",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (isAdmin(client, message.user)) {
			const queue = await redis.zrevrange("myset", 0, -1);
			const users = [];
			for (const value of queue) {
				const user = await getUser(client, value);
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

app.message(
	"super",
	async ({ message, client, say }: SlackResponse): Promise<void> => {
		if (isAdmin(client, message.user)) {
			//parse userId from message and remove special chars
			const userId = message.text.split(" ")[2].replace(/[<>@]/g, "");
			const user = await getUser(client, userId);
			const remove = await redis.zrem("myset", userId);
			console.log(remove);
			await say(
				`${
					user.user.profile.display_name || user.user.profile.real_name
				} has been removed from the queue`
			);
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
app.message(
	"where ",
	async ({ message, say }: SlackResponse): Promise<void> => {
		const r = await redis.exists("myset", message.user);
		if (!r) {
			say("You are not in the Q");
			return;
		}
		const res = await redis.zrank("myset", message.user);
		console.log(res);
		//Queue is zero indexed so add one
		const userRank = res + 1;

		say(`You're ${userRank} spots away`);
	}
);

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
