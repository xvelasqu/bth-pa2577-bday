import { connect } from "https://deno.land/x/amqp@v0.23.1/mod.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const connection = await connect(
  Deno.env.get("RABBITMQ_URL") || "amqp://localhost:5672",
);
const channel = await connection.openChannel();

const client = new SMTPClient({
  connection: {
    hostname: Deno.env.get("SMTP_HOST") || "smtp.example.com",
    port: Number(Deno.env.get("SMTP_PORT")) || 465,
    tls: false,
  },
});

console.log("-- Consumer is ON! --");

channel.consume({ queue: "email_queue" }, async (msg) => {
  const payload = JSON.parse(msg.toString());

  await client.send({
    from: "bday-reminders@example.org",
    to: payload.email,
    subject: "Birthday Reminder",
    content:
      `Hello! Today is ${payload.name}'s birthday!\n\nLanded in this world on ${payload.date}.`,
    // html: "<p>...</p>",
  });

  await client.close();

  channel.ack(msg);
});
