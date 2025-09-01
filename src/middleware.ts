import dotenv from "dotenv"
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
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