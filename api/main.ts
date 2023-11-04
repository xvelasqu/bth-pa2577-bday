import {
  Application,
  Router,
} from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const app = new Application();

const client = new MongoClient();
await client.connect(Deno.env.get("MONGO_URL") || "mongodb://localhost:27017");
const db = client.database("myDB");
const birthdaysCollection = db.collection("birthdays");

//////
// API
//////

const router = new Router();
app.use(async (ctx, next) => {
  await ctx.request.body().value;
  await next();
});

router.post("/birthdays", async (ctx) => {
  const body = ctx.request.body();
  const { date, name, email } = await body.value;

  const dateFormmatted: Date = new Date(date);

  await birthdaysCollection.insertOne({
    date: dateFormmatted,
    name,
    email,
  });
  ctx.response.body = { message: "Ok." };
});

router.get("/", async (ctx) => {
  const filePath = `${Deno.cwd()}/app/static/index.html`;
  const fileContent = await Deno.readTextFile(filePath);
  ctx.response.body = fileContent;
  ctx.response.type = 'text/html';
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
