import express from "express"
import { getMyDetails, login, logout, register, verifyUser } from "../controllers/auth.controller.js";
import { checkLogin } from "../middleware/login.middleware.js";

const app = express.Router()


app.post("/register", register)
app.post("/login", login)
app.get("/verify/:id", verifyUser)

app.use(checkLogin)
app.delete("/logout",logout)
app.get("/me", getMyDetails)

export default app;