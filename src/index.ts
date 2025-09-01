import express from "express"
import cors from "cors"
import { connectDB } from "./database/client.js";
import rootRouter from "./routes/index.js"

const app = express()
app.use(cors())
app.use(express.json())

await connectDB()

app.use("/api/v1", rootRouter);

app.listen(3000, () => {
    console.log("listening at port 3000")
})