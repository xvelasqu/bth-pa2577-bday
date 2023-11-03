import {
  Application,
  Router,
  send,
} from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const app = new Application();

const client = new MongoClient();
await client.connect(Deno.env.get("MONGO_URL") || "mongodb://localhost:27017");
const db = client.database("myDB");
const birthdaysCollection = db.collection("birthdays");

//////
// Static HTML
//////
app.use(async (ctx) => {
  if (ctx.request.url.pathname === "/") {
    await send(ctx, ctx.request.url.pathname, {
      root: `${Deno.cwd()}/app/static`,
      index: "index.html",
    });
  }
});

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

  await birthdaysCollection.insertOne({
    date,
    name,
    email,
  });
  ctx.response.body = { message: "Ok." };
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
