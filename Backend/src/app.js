import express, { urlencoded } from "express"
import cookieParser from "cookie-parser";
import dotenv from "dotenv"


const app = express();


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


dotenv.config()

// Routes import here
import authRoutes from "./routes/auth.Route.js"
import { healthCheck } from "./controllers/health.controller.js";


// route add here
app.use("api/v1", healthCheck)
app.use("api/v1/auth", authRoutes)




export default app;