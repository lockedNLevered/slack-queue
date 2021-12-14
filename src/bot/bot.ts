import { App } from "@slack/bolt";
import Redis from "ioredis";

const app = new App({
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	token: process.env.SLACK_BOT_TOKEN,
	socketMode: true,
	appToken: process.env.SLACK_APP_TOKEN,
});

const QUEUE = process.env.QUEUE as string;
const redis = new Redis(parseInt(process.env.REDIS_PORT as string));

export default app;
export { QUEUE, redis };
