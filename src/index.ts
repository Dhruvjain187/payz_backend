import express from "express"
import cors from "cors"
import { connectDB } from "./database/client.js";
import rootRouter from "./routes/index.js"
import dotenv from "dotenv";

dotenv.config();

const app = express()
const port = process.env.PORT || 5000

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

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

app.use("/api/v1", rootRouter);


app.listen(port, () => {
    console.log(`listening at port ${port}`)
})