import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";

export interface MessageResponse {
	message: any;
}

export type SlackResponse = SlackEventMiddlewareArgs<"message"> &
	AllMiddlewareArgs &
	MessageResponse;
