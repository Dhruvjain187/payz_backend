import express from "express"
import { authMiddleware } from "../middleware.js"
import { Account } from "@prisma/client"
import prisma from "../database/client.js"

const router = express.Router()

router.get("/balance", authMiddleware, async (req, res) => {
    try {
        const account = await prisma.account.findUnique({
            where: {
                userId: req.userId, // comes from authMiddleware
            },
            select: {
                balance: true,
            },
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        res.json({ balance: account.balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong" });
    }
});



router.post("/transfer", authMiddleware, async (req, res) => {
    const { amount, to } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Get sender's account
            const account = await tx.account.findUnique({
                where: { userId: req.userId },
            });

            if (!account || account.balance < amount) {
                throw new Error("Insufficient balance");
            }

            // Get receiver's account
            const toAccount = await tx.account.findUnique({
                where: { userId: to },
            });

            if (!toAccount) {
                throw new Error("Invalid account");
            }

            // Deduct from sender
            await tx.account.update({
                where: { userId: req.userId },
                data: { balance: { decrement: amount } },
            });

            // Add to receiver
            await tx.account.update({
                where: { userId: to },
                data: { balance: { increment: amount } },
            });
        });

        res.json({ message: "Transfer successful" });
    } catch (err: any) {
        console.error(err);
        res.status(400).json({ message: err.message || "Transfer failed" });
    }
});

export default router;