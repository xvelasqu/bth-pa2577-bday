import { connect } from "https://deno.land/x/amqp@v0.23.1/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const rabbitmqConnection = await connect(
  Deno.env.get("RABBITMQ_URL") || "amqp://localhost:5672",
);
const rabbitmqChannel = await rabbitmqConnection.openChannel();

const mongoClient = new MongoClient();
await mongoClient.connect(
  Deno.env.get("MONGO_URL") || "mongodb://localhost:27017",
);
const db = mongoClient.database("myDB");
const birthdaysCollection = db.collection("birthdays");

console.log("-- Worker is ON! --");

function checkBirthdays() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  birthdaysCollection.find({
    $expr: {
      $and: [
        { $eq: [{ $month: "$date" }, currentMonth] },
        { $eq: [{ $dayOfMonth: "$date" }, currentDay] },
      ],
    },
  }).toArray()
    .then((birthdays) => {
      if (birthdays.length > 0) {
        birthdays.forEach((birthday) => {
          const message = JSON.stringify(birthday);

          rabbitmqChannel.publish({
            exchange: "",
            routingKey: "birthday_queue",
          }, {
            contentType: "application/json",
          }, new TextEncoder().encode(message));

          console.log(`Queued birthday reminder: ${message}`);
        });
      }
    })
    .catch((error) => {
      console.error("Error checking birthdays:", error);
    });
}

// run every 24 hours
setInterval(checkBirthdays, 86400);
