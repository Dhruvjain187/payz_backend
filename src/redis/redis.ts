import { Redis } from "ioredis";

// connect to Redis running in Docker
console.log("redis url=", process.env.REDIS_URL)
export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
