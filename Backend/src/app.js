import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";


const app = express();


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


dotenv.config()

// Routes import here
import { healthCheck } from "./controllers/health.controller.js";
import authRoutes from "./routes/auth.Route.js";


// route add here
app.use("/api/v1/check", healthCheck)
app.use("/api/v1/auth", authRoutes)




export default app;