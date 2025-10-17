import { generateAdminToken } from "../middlewares/auth.middleware.js";
import { Quiz } from "../models/quiz.model.js";
import { Allowed } from "../models/allowed.model.js";
import { User } from "../models/user.model.js";

export const adminLogin = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required",
            });
        }

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_PASSWORD) {
            console.error("ADMIN_PASSWORD environment variable not set");
            return res.status(500).json({
                success: false,
                message: "Admin authentication not configured",
            });
        }

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin password",
            });
        }

        const token = generateAdminToken();

        res.cookie("adminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
        });
    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const adminLogout = async (req, res) => {
    try {
        res.clearCookie("adminToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });

        return res.status(200).json({
            success: true,
            message: "Admin logged out successfully",
        });
    } catch (error) {
        console.error("Admin Logout Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const verifyAdmin = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Admin verified",
            admin: {
                role: req.admin.role,
                isAdmin: req.admin.isAdmin,
            },
        });
    } catch (error) {
        console.error("Verify Admin Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ============= Quiz/Test Management =============

// Get all quizzes
export const getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find()
            .select("_id title description duration createdAt updatedAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Quizzes retrieved successfully",
            count: quizzes.length,
            quizzes,
        });
    } catch (error) {
        console.error("Get All Quizzes Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get single quiz by ID (with all questions)
export const getQuizById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Quiz ID is required",
            });
        }

        const quiz = await Quiz.findById(id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Quiz retrieved successfully",
            quiz,
        });
    } catch (error) {
        console.error("Get Quiz By ID Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID format",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Create new quiz
export const createQuiz = async (req, res) => {
    try {
        const { title, description, duration, questions } = req.body;

        if (!title || !description || !duration || !questions) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: title, description, duration, questions",
            });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Questions must be a non-empty array",
            });
        }

        // Validate each question has required fields
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question || !q.options || !q.answer) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} is missing required fields (question, options, answer)`,
                });
            }

            if (!Array.isArray(q.options) || q.options.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: `Question ${i + 1} must have at least 2 options`,
                });
            }

            // Set correctAnswers index if not provided
            if (q.correctAnswers === undefined || q.correctAnswers === null) {
                const answerIndex = q.options.indexOf(q.answer);
                if (answerIndex === -1) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${i + 1}: answer "${q.answer}" not found in options`,
                    });
                }
                questions[i].correctAnswers = answerIndex;
            }
        }

        const newQuiz = new Quiz({
            title,
            description,
            duration,
            questions,
        });

        await newQuiz.save();

        return res.status(201).json({
            success: true,
            message: "Quiz created successfully",
            quiz: newQuiz,
        });
    } catch (error) {
        console.error("Create Quiz Error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map((e) => e.message),
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Update existing quiz
export const updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, duration, questions } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Quiz ID is required",
            });
        }

        const quiz = await Quiz.findById(id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        // Update fields if provided
        if (title !== undefined) quiz.title = title;
        if (description !== undefined) quiz.description = description;
        if (duration !== undefined) quiz.duration = duration;

        if (questions !== undefined) {
            if (!Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Questions must be a non-empty array",
                });
            }

            // Validate questions
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.question || !q.options || !q.answer) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${i + 1} is missing required fields`,
                    });
                }

                if (!Array.isArray(q.options) || q.options.length < 2) {
                    return res.status(400).json({
                        success: false,
                        message: `Question ${i + 1} must have at least 2 options`,
                    });
                }

                // Set correctAnswers index if not provided
                if (q.correctAnswers === undefined || q.correctAnswers === null) {
                    const answerIndex = q.options.indexOf(q.answer);
                    if (answerIndex === -1) {
                        return res.status(400).json({
                            success: false,
                            message: `Question ${i + 1}: answer "${q.answer}" not found in options`,
                        });
                    }
                    questions[i].correctAnswers = answerIndex;
                }
            }

            quiz.questions = questions;
        }

        await quiz.save();

        return res.status(200).json({
            success: true,
            message: "Quiz updated successfully",
            quiz,
        });
    } catch (error) {
        console.error("Update Quiz Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID format",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map((e) => e.message),
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Quiz ID is required",
            });
        }

        const quiz = await Quiz.findByIdAndDelete(id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Quiz deleted successfully",
            deletedQuiz: {
                id: quiz._id,
                title: quiz.title,
            },
        });
    } catch (error) {
        console.error("Delete Quiz Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID format",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ============= Allowed Users Management =============

// Get all allowed users
export const getAllowedUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = "" } = req.query;

        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            Allowed.find(query)
                .select("name email phone createdAt updatedAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Allowed.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            message: "Allowed users retrieved successfully",
            count: users.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            users,
        });
    } catch (error) {
        console.error("Get Allowed Users Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get single allowed user by ID
export const getAllowedUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await Allowed.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Allowed user not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Allowed user retrieved successfully",
            user,
        });
    } catch (error) {
        console.error("Get Allowed User By ID Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Add new allowed user
export const addAllowedUser = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: name, email, phone",
            });
        }

        // Check if user already exists
        const existingUser = await Allowed.findOne({ email: email.toLowerCase().trim() });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists in the allowed list",
            });
        }

        const newUser = new Allowed({
            name,
            email,
            phone,
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User added to allowed list successfully",
            user: newUser,
        });
    } catch (error) {
        console.error("Add Allowed User Error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map((e) => e.message),
            });
        }

        if (error.message?.includes("already exists")) {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Update allowed user
export const updateAllowedUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await Allowed.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Allowed user not found",
            });
        }

        // Check if email is being changed and if it already exists
        if (email && email.toLowerCase().trim() !== user.email) {
            const existingUser = await Allowed.findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: id },
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Another user with this email already exists",
                });
            }
        }

        // Update fields if provided
        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Allowed user updated successfully",
            user,
        });
    } catch (error) {
        console.error("Update Allowed User Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map((e) => e.message),
            });
        }

        if (error.message?.includes("already exists")) {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Delete allowed user
export const deleteAllowedUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await Allowed.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Allowed user not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User removed from allowed list successfully",
            deletedUser: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Delete Allowed User Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// ============= User Results Management =============

// Get all user results
export const getAllResults = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = "", status = "all", sortBy = "createdAt", order = "desc" } = req.query;

        // Build query
        let query = {};

        // Status filter
        if (status === "submitted") {
            query.hasSubmitted = true;
        } else if (status === "in-progress") {
            query.hasStarted = true;
            query.hasSubmitted = false;
        } else if (status === "not-started") {
            query.hasStarted = false;
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === "asc" ? 1 : -1;
        const sortField = {};
        sortField[sortBy] = sortOrder;

        const [users, total] = await Promise.all([
            User.find(query)
                .select("name email phone hasStarted hasSubmitted score qualifiedForInterview timeUsed createdAt updatedAt")
                .sort(sortField)
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query),
        ]);

        // Calculate statistics
        const stats = {
            total,
            submitted: await User.countDocuments({ hasSubmitted: true }),
            inProgress: await User.countDocuments({ hasStarted: true, hasSubmitted: false }),
            notStarted: await User.countDocuments({ hasStarted: false }),
        };

        return res.status(200).json({
            success: true,
            message: "User results retrieved successfully",
            count: users.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            stats,
            users,
        });
    } catch (error) {
        console.error("Get All Results Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get single user result by ID
export const getResultById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User result retrieved successfully",
            user,
        });
    } catch (error) {
        console.error("Get Result By ID Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get detailed analytics
export const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const submittedUsers = await User.countDocuments({ hasSubmitted: true });
        const inProgressUsers = await User.countDocuments({ hasStarted: true, hasSubmitted: false });
        const notStartedUsers = await User.countDocuments({ hasStarted: false });

        // Score statistics
        const submittedUsersData = await User.find({ hasSubmitted: true }).select("score timeUsed");

        let scoreStats = {
            average: 0,
            highest: 0,
            lowest: 0,
            median: 0,
        };

        let timeStats = {
            average: 0,
            highest: 0,
            lowest: 0,
        };

        if (submittedUsersData.length > 0) {
            const scores = submittedUsersData.map(u => u.score).sort((a, b) => a - b);
            const times = submittedUsersData.map(u => u.timeUsed).sort((a, b) => a - b);

            scoreStats = {
                average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
                highest: Math.max(...scores),
                lowest: Math.min(...scores),
                median: scores.length % 2 === 0
                    ? ((scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2).toFixed(2)
                    : scores[Math.floor(scores.length / 2)],
            };

            timeStats = {
                average: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
                highest: Math.max(...times),
                lowest: Math.min(...times),
            };
        }

        // Score distribution
        const scoreDistribution = {
            excellent: await User.countDocuments({ hasSubmitted: true, score: { $gte: 12 } }), // 80%+
            good: await User.countDocuments({ hasSubmitted: true, score: { $gte: 9, $lt: 12 } }), // 60-79%
            average: await User.countDocuments({ hasSubmitted: true, score: { $gte: 6, $lt: 9 } }), // 40-59%
            poor: await User.countDocuments({ hasSubmitted: true, score: { $lt: 6 } }), // <40%
        };

        // Qualified users
        const qualifiedCount = await User.countDocuments({ qualifiedForInterview: true });

        return res.status(200).json({
            success: true,
            message: "Analytics retrieved successfully",
            analytics: {
                overview: {
                    totalUsers,
                    submittedUsers,
                    inProgressUsers,
                    notStartedUsers,
                    completionRate: totalUsers > 0 ? ((submittedUsers / totalUsers) * 100).toFixed(2) : 0,
                },
                scores: scoreStats,
                time: timeStats,
                distribution: scoreDistribution,
                qualified: {
                    count: qualifiedCount,
                    percentage: submittedUsers > 0 ? ((qualifiedCount / submittedUsers) * 100).toFixed(2) : 0,
                },
            },
        });
    } catch (error) {
        console.error("Get Analytics Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Export results to CSV format
export const exportResults = async (req, res) => {
    try {
        const { status = "submitted" } = req.query;

        let query = {};
        if (status === "submitted") {
            query.hasSubmitted = true;
        } else if (status === "in-progress") {
            query.hasStarted = true;
            query.hasSubmitted = false;
        } else if (status === "not-started") {
            query.hasStarted = false;
        }

        const users = await User.find(query)
            .select("name email phone score hasSubmitted qualifiedForInterview timeUsed createdAt")
            .sort({ score: -1 });

        // Build CSV
        const csvHeaders = ["Name", "Email", "Phone", "Score", "Time Used (min)", "Status", "Qualified", "Date"];
        const csvRows = users.map(user => [
            user.name,
            user.email,
            user.phone || "N/A",
            user.hasSubmitted ? user.score : "N/A",
            user.hasSubmitted ? user.timeUsed : "N/A",
            user.hasSubmitted ? "Submitted" : user.hasStarted ? "In Progress" : "Not Started",
            user.qualifiedForInterview ? "Yes" : "No",
            new Date(user.createdAt).toLocaleDateString(),
        ]);

        const csv = [
            csvHeaders.join(","),
            ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        return res.status(200).json({
            success: true,
            message: "Results exported successfully",
            count: users.length,
            csv,
        });
    } catch (error) {
        console.error("Export Results Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Update user's qualification status
export const updateQualificationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { qualifiedForInterview } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (typeof qualifiedForInterview !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "qualifiedForInterview must be a boolean value",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.hasSubmitted) {
            return res.status(400).json({
                success: false,
                message: "Cannot update qualification status for user who hasn't submitted the quiz",
            });
        }

        user.qualifiedForInterview = qualifiedForInterview;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Qualification status updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                score: user.score,
                qualifiedForInterview: user.qualifiedForInterview,
            },
        });
    } catch (error) {
        console.error("Update Qualification Status Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Delete user result
export const deleteUserResult = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User result deleted successfully",
            deletedUser: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Delete User Result Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

