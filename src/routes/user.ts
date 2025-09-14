import express from "express"
import { User, Account } from "@prisma/client"
import zod from "zod"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import prisma from "../database/client.js"
import { SigninRequest, SignupRequest, UserResponse } from "../types/user.js"
import bcrypt from "bcryptjs"
import { authMiddleware, rateLimiter } from "../middleware.js"

dotenv.config()

const router = express.Router()

const signupSchema = zod.object({
    username: zod.string(),
    password: zod.string().min(5),
    firstName: zod.string(),
    lastName: zod.string(),
})

const signinSchema = zod.object({
    username: zod.string(),
    password: zod.string().min(5)
});

const updateBody = zod.object({
    password: zod.string().min(5).optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
});

router.post("/signup", async (req, res) => {
    const userObj: SignupRequest = req.body;
    console.log("req.body=", req.body)
    const response = signupSchema.safeParse(userObj)

    if (!response.success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        })
    }


    const existingUser = await prisma.user.findUnique({
        where: { username: userObj.username },
    })

    if (existingUser) {
        return res.status(411).json({ message: "Email already taken" })
    }

    const hashedPassword = await bcrypt.hash(userObj.password, 10);

    const user = await prisma.user.create({
        data: {
            username: userObj.username,
            password: hashedPassword, // 🔒 ideally hash with bcrypt before saving
            firstName: userObj.firstName,
            lastName: userObj.lastName,
        },
    });

    await prisma.account.create({
        data: {
            userId: user.id,
            balance: 1 + Math.random() * 10000,
        },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);

    const data: UserResponse = {
        message: "User created successfully",
        token,
    }

    res.json(data);
})



router.post("/signin", rateLimiter, async (req, res) => {
    const userObj: SigninRequest = req.body;
    const response = signinSchema.safeParse(userObj);

    if (!response.success) {
        return res.status(411).json({
            msg: "Incorrect inputs",
        });
    }

    // Find user by username only (not password)
    const user = await prisma.user.findFirst({
        where: {
            username: userObj.username
        }
    });

    if (!user) {
        return res.status(411).json({
            message: "Invalid username or password",
        });
    }


    const isPasswordValid = await bcrypt.compare(userObj.password, user.password);

    if (isPasswordValid) {
        const userId = user.id;
        const token = jwt.sign({ userId }, process.env.JWT_SECRET!);

        res.json({
            id: user.id,
            username: user.username,
            token: token,
        });
    } else {
        res.status(411).json({
            message: "Invalid username or password",
        });
    }
});



router.put("/", authMiddleware, async (req, res) => {
    const parsed = updateBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(411).json({
            message: "Error while updating information",
        });
    }

    try {
        let updateData = { ...parsed.data };

        // Hash password if it's being updated
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        await prisma.user.update({
            where: { id: req.userId },
            data: updateData,
        });

        res.json({
            message: "Updated successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong while updating",
        });
    }
});



router.get("/bulk", authMiddleware, async (req, res) => {
    const filter = (req.query.filter as string) || "";

    try {
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        id: {
                            not: req.userId // Exclude current user
                        }
                    },
                    {
                        OR: [
                            { firstName: { contains: filter, mode: "insensitive" } },
                            { lastName: { contains: filter, mode: "insensitive" } },
                        ]
                    }
                ]
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
            },
        });

        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong" });
    }
});

router.get("/personalInfo", authMiddleware, async (req, res) => {
    console.log("userid=", req.userId)
    try {
        const users = await prisma.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                account: {
                    select: {
                        id: true,
                        balance: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            },
        });

        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong" });
    }
});


export default router;