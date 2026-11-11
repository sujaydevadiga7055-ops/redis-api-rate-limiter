
require("dotenv").config();

const express = require("express");
const { createClient } = require("redis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const app = express();
app.use(express.json());

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.get("/", (req, res) => {
  res.json({ message: "Redis Rate Limiter API is running" });
});

app.use("/api", limiter);

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Request allowed",
  });
});

async function startServer() {
  await redisClient.connect();

  app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port 3000");
    console.log("Redis connected successfully");
  });
}

startServer().catch(console.error);
