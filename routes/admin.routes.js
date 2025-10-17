import { Router } from "express";
import { adminAuthMiddleware } from "../middlewares/auth.middleware.js";
import {
    adminLogin,
    adminLogout,
    verifyAdmin,
    getAllQuizzes,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getAllowedUsers,
    getAllowedUserById,
    addAllowedUser,
    updateAllowedUser,
    deleteAllowedUser,
    getAllResults,
    getResultById,
    getAnalytics,
    exportResults,
    updateQualificationStatus,
    deleteUserResult,
} from "../controllers/admin.controllers.js";

const adminRoutes = Router();

// Public routes
adminRoutes.post("/login", adminLogin);

// Protected routes (require admin authentication)
adminRoutes.get("/logout", adminAuthMiddleware, adminLogout);
adminRoutes.get("/verify", adminAuthMiddleware, verifyAdmin);

// Quiz/Test Management Routes (protected)
adminRoutes.get("/quizzes", adminAuthMiddleware, getAllQuizzes);
adminRoutes.get("/quizzes/:id", adminAuthMiddleware, getQuizById);
adminRoutes.post("/quizzes", adminAuthMiddleware, createQuiz);
adminRoutes.put("/quizzes/:id", adminAuthMiddleware, updateQuiz);
adminRoutes.delete("/quizzes/:id", adminAuthMiddleware, deleteQuiz);

// Allowed Users Management Routes (protected)
adminRoutes.get("/allowed-users", adminAuthMiddleware, getAllowedUsers);
adminRoutes.get("/allowed-users/:id", adminAuthMiddleware, getAllowedUserById);
adminRoutes.post("/allowed-users", adminAuthMiddleware, addAllowedUser);
adminRoutes.put("/allowed-users/:id", adminAuthMiddleware, updateAllowedUser);
adminRoutes.delete("/allowed-users/:id", adminAuthMiddleware, deleteAllowedUser);

// User Results Management Routes (protected)
adminRoutes.get("/results", adminAuthMiddleware, getAllResults);
adminRoutes.get("/results/:id", adminAuthMiddleware, getResultById);
adminRoutes.get("/analytics", adminAuthMiddleware, getAnalytics);
adminRoutes.get("/export-results", adminAuthMiddleware, exportResults);
adminRoutes.put("/results/:id/qualification", adminAuthMiddleware, updateQualificationStatus);
adminRoutes.delete("/results/:id", adminAuthMiddleware, deleteUserResult);

export default adminRoutes;
