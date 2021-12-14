require("dotenv").config();
import {
	appRemove,
	appHelp,
	appAdd,
	appDelete,
	appQuery,
	appInsert,
	appWhere,
} from "./bot/actions";
import app from "./bot";

(async () => {
	await app.start(3000);
	await appHelp();
	await appAdd();
	await appInsert();
	await appWhere();
	await appDelete();
	await appQuery();
	await appRemove();
	console.log("app is running!");
})();
