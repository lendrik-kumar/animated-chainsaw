import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { limitAuth } from "../middlewares/rateLimit.middleware.js";
import { googleAuth, logout, startQuiz, submitQuiz, verifyAuth } from "../controllers/user.controllers.js";

const userRoutes = Router();

userRoutes.post("/google", limitAuth, googleAuth);
userRoutes.get("/logout", authMiddleware, logout);
userRoutes.get("/verify", authMiddleware, verifyAuth);
userRoutes.post("/start-quiz", authMiddleware, startQuiz);
userRoutes.post("/submit-quiz", authMiddleware, submitQuiz)

export default userRoutes;