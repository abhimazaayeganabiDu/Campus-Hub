import express from "express"
import { healthCheck } from "../controllers/health.controller.js"

const app = express.Router()

app.get("/health", healthCheck)


export default app