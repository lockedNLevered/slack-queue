import {
	buildMessage,
	isAdmin,
	getUser,
	isInQueue,
	rank,
} from "../utils/helpers";
import { SlackResponse } from "../utils/types";
import app, { redis, QUEUE } from "./appConfig";
//documentation function explaining commands
export const appHelp = () =>
	app.message(
		"help",
		async ({ message, client, say }: SlackResponse): Promise<void> => {
			const docMessage = buildMessage(
				await isAdmin(client, message.user),
				message.user
			);
			await say(docMessage);
		}
	);
//ADMIN -> displays users in the Queue with their human readable index
export const appQuery = () =>
	app.message(
		"query",
		async ({ message, client, say }: SlackResponse): Promise<void> => {
			if (await isAdmin(client, message.user)) {
				const queue = await redis.zrevrange(QUEUE, 0, -1);

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
export const appDelete = () =>
	app.message(
		"delete",
		async ({ message, client, say }: SlackResponse): Promise<void> => {
			if (await isAdmin(client, message.user)) {
				//parse userId from message and remove special chars
				const userId = message.text.split(" ")[2].replace(/[<>@]/g, "");
				await redis.zrem(QUEUE, userId);
				await say(`<@${userId}> has been removed from the queue`);
			}
		}
	);
//ADMIN -> inserts a user by name into the queue
export const appInsert = () =>
	app.message(
		"insert",
		async ({ message, client, say }: SlackResponse): Promise<void> => {
			if (await isAdmin(client, message.user)) {
				//parse userId from message and remove special chars
				const userId = message.text.split(" ")[2].replace(/[<>@]/g, "");
				redis.zadd(QUEUE, Date.now(), userId);
				await say(
					`<@${userId}> was added to the queue by <@${message.user}>. run *query* to view the queue`
				);
			}
		}
	);
//adds the sender into the queue
export const appAdd = () =>
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
export const appWhere = () =>
	app.message(
		"where",
		async ({ message, say }: SlackResponse): Promise<void> => {
			if (!(await isInQueue(redis, QUEUE, message.user))) {
				say("You are not in the Q");
				return;
			}
			const rankRes = await rank(QUEUE, redis, message.user);
			//Queue is zero indexed so add one
			const userRank = rankRes + 1;
			say(`You're ${userRank} spots away`);
		}
	);
//removes the sender form the queue
export const appRemove = () =>
	app.message(
		"remove",
		async ({ message, say }: SlackResponse): Promise<void> => {
			await redis.zrem(QUEUE, message.user);
			await say(`Removed <@${message.user}> from queue`);
		}
	);
