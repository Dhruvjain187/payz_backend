import express from "express"
import cors from "cors"
import { connectDB } from "./database/client.js";
import rootRouter from "./routes/index.js"
import dotenv from "dotenv";

dotenv.config();

const app = express()
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

await connectDB()

app.get("/health", (req, res) => {
    console.log("health check");
    res.send("ok")
})

app.use("/api/v1", rootRouter);


app.listen(5000, () => {
    console.log("listening at port 5000")
})