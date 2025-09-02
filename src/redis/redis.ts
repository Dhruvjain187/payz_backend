import { Redis } from "ioredis";

// connect to Redis running in Docker
export const redis = new Redis("redis://localhost:6379");
