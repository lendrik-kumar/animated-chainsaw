import { Router } from "express";
import { authMiddleware, firebaseAuthMiddleware } from "../middlewares/auth.middleware.js";
import { limitAuth } from "../middlewares/rateLimit.middleware.js";
import { firebaseAuth, googleAuth, logout, startQuiz, submitQuiz, verifyAuth } from "../controllers/user.controllers.js";

const userRoutes = Router();

// New secure Firebase authentication endpoint
userRoutes.post("/firebase-auth", firebaseAuthMiddleware, firebaseAuth);

// Legacy Google auth endpoint (deprecated)
userRoutes.post("/google", limitAuth, googleAuth);
userRoutes.get("/logout", authMiddleware, logout);
userRoutes.get("/verify", authMiddleware, verifyAuth);
userRoutes.post("/start-quiz", authMiddleware, startQuiz);
userRoutes.post("/submit-quiz", authMiddleware, submitQuiz)

export default userRoutes;