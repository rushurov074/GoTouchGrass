require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/go-touch-grass-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();

const runLogs = [];

app.command("/go-touch-grass-log", async ({ command, ack, respond }) => {
  await ack();

  const args = command.text.trim().split(" ");

  if (args.length < 2) {
    await respond({ 
      text: "Please format your log as: `/go-touch-grass-log [miles] [minutes]`\nExample: `/go-touch-grass-log 3 25`" 
    });
    return;
  }

  const miles = parseFloat(args[0]);
  const minutes = parseInt(args[1]);

  if (isNaN(miles) || isNaN(minutes)) {
    await respond({ text: "⚠️ Please use numbers for your miles and minutes!" });
    return;
  }

  const now = new Date();
  
  const logEntry = {
    userId: command.user_id,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    miles: miles,
    minutes: minutes
  };

  runLogs.push(logEntry);

  await respond({
    text: `**Activity Logged!**\nYou ran ${miles} miles in ${minutes} minutes on ${logEntry.date} at ${logEntry.time}. Great work!`
  });
});

app.command("/go-touch-grass-view", async ({ command, ack, respond }) => {
  await ack();

  const userLogs = runLogs.filter(log => log.userId === command.user_id);

  if (userLogs.length === 0) {
    await respond({ text: "You haven't logged any runs yet. Time to hit the track!" });
    return;
  }

  let replyText = "*Your Running Log:*\n";
  userLogs.forEach((log, index) => {
    replyText += `${index + 1}. **${log.date}** at ${log.time} - ${log.miles} miles in ${log.minutes} mins\n`;
  });

  await respond({ text: replyText });
});

app.command("/go-touch-grass-delete", async ({ command, ack, respond }) => {
  await ack();

  const args = command.text.trim().split(" ");
  const logNumber = parseInt(args[0]);

  if (isNaN(logNumber) || logNumber < 1) {
    await respond({ text: "Please provide the log number you want to delete.\nExample: `/go-touch-grass-delete 1`" });
    return;
  }

  const userLogs = runLogs.filter(log => log.userId === command.user_id);

  if (logNumber > userLogs.length) {
    await respond({ text: `You only have ${userLogs.length} log(s).` });
    return;
  }

  const logToDelete = userLogs[logNumber - 1];
  const globalIndex = runLogs.indexOf(logToDelete);

  if (globalIndex > -1) {
    runLogs.splice(globalIndex, 1);
    await respond({ text: `Deleted log #${logNumber}: ${logToDelete.miles} miles in ${logToDelete.minutes} mins.` });
  } else {
    await respond({ text: "Error: Could not find that log." });
  }
});

app.command("/go-touch-grass-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text:
`Available Commands:
/go-touch-grass-ping - Check bot latency
/go-touch-grass-log - Log your activity
/go-touch-grass-view - View your activity
/go-touch-grass-delete - Delete a specific log (e.g., /go-touch-grass-delete 1)`
  });
});