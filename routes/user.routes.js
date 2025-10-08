import { Router } from "express";
import { googleAuth } from "../controllers/user.controllers.js";

const userRoutes = Router();

userRoutes.post("/google", googleAuth)

export default userRoutes;