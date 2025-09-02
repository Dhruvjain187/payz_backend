import dotenv from "dotenv"
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { redis } from "./redis/redis.js";
dotenv.config()

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({});
    }

    const token = authHeader.split(" ")[1];

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

        if (decoded && typeof decoded === "object" && "userId" in decoded) {
            req.userId = decoded.userId as string;
        }

        next();
    } catch (err) {
        return res.status(403).json({ msg: "Authorization failed" });
    }
}




const WINDOW_SIZE = 60; // seconds
const MAX_REQUESTS = 10;

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    try {
        // Use userId if authenticated, otherwise fallback to IP
        const key = `rate_limit:${req.userId || req.ip}`;
        console.log("key=", key)
        const current = await redis.incr(key);
        console.log("current=", current)
        if (current === 1) {
            // first request, set expiry
            await redis.expire(key, WINDOW_SIZE);
        }

        if (current > MAX_REQUESTS) {
            return res.status(429).json({
                message: "Too many requests. Please try again later.",
            });
        }

        next();
    } catch (err) {
        console.error("Rate limiter error:", err);
        // fail open — allow request if Redis is down
        next();
    }
}