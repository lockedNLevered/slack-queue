Application for managing a queue in a Slack Workspace.

Actions are triggered by tagging the bot in your workspace followed by a command.

Example:

**@BOT add** -> would add the sender to the queue. 
**@BOT insert @user** -> If sent by an admin, would add @user to the queue.

Available actions:

Admin:

- Add users to queue by @name -> **@BOT insert @user**
- Remove user from queue by @name -> **@BOT delete @user**
- View entire queue -> **@BOT query**

General:

- Add youself to queue -> **@BOT add**
- Remove yourself from the queue -> **@BOT remove**
- View your current place in the queue -> **@BOT where**

Notes:
.env.example contains necessary variables that need to be supplied
@BOT would be replaced with the name you assigned your app in the Slack API portal https://api.slack.com/

Tech used:

- TypeScript
- Redis

Originally created and run as a pair of Docker Containers.
