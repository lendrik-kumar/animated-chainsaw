import { User } from "../models/user.model.js"
import { Quiz } from "../models/quiz.model.js"
import { Allowed } from "../models/allowed.model.js";
import { generateToken } from "../middlewares/auth.middleware.js";

export const googleAuth = async(req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const find = await Allowed.findOne({ email: normalizedEmail });

        if (!find) {
            return res.status(403).json({
                success: false,
                message: "Email is not allowed"
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail })

        if (existingUser) {
            const hasStarted = existingUser.hasStarted && !existingUser.hasSubmitted;
            const token = generateToken(existingUser);
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 
            });

            return res.status(200).json({
                success: true,
                message: "User exists",
                user: {
                    email: existingUser.email,
                    name: existingUser.name,
                    isResuming: hasStarted
                }
            });
        }

        const newUser = new User({
            name: find.name || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            hasStarted: false,
            hasSubmitted: false,
            phone: find.phone || null,
            score: 0,
            timeUsed: 0,
            quiz: null,
            responses: [],
            qualifiedForInterview: false
        })

        await newUser.save()

        const token = generateToken(newUser);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 
        });

        return res.status(200).json({
            success: true,
            message: "Authentication successful",
            user: {
                name: newUser.name,
                email: newUser.email,
                isResuming: false
            }
        });
    } catch (error) {
        console.error("Google Auth Error:", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const getUserInfo = async (req, res) => {
    try {
        const { id, email } = req.user

        if (!id || !email) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication details"
            })
        }

        const user = await User.findOne({ _id: id, email }).select("name email")

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        res.status(200).json({
            success: true,
            user: {
                name: user.name,
                email: user.email
            }
        })
    } catch (error) {
        console.error("Get User Info Error:", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        })

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        console.error("Logout Error:", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const verifyAuth = async (req, res) => {
  try {
    const user = await User.findOne({ 
      _id: req.user.id, 
      email: req.user.email 
    }).select('name email hasStarted hasSubmitted');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        isResuming: user.hasStarted && !user.hasSubmitted
      }
    });
  } catch (error) {
    console.error('Verify Auth Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getRandomTest = async () => {
    try {
        const quiz = await Quiz.findOne().select("questions")

        if (!quiz || !quiz.questions?.length) return []

        // Clone to avoid mutation
        const questions = [...quiz.questions]

        // Fisher–Yates shuffle
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[questions[i], questions[j]] = [questions[j], questions[i]]
        }

        // Pick 15 random questions with id + image (if exists)
        return questions.slice(0, 15).map(q => ({
            id: q._id,
            question: q.question,
            options: q.options,
            image: q.image || null
        }))
    } catch (error) {
        console.error("❌ getRandomTest Error:", error)
        return []
    }
}

export const startQuiz = async (req, res) => {
    try {
        const { id, email } = req.user
        if (!id || !email)
            return res.status(400).json({ success: false, message: "Invalid authentication details" })

        const user = await User.findOne({ _id: id, email })
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" })

        if (user.hasSubmitted)
            return res.status(400).json({ success: false, message: "Quiz already submitted" })

        if (user.hasStarted && !user.hasSubmitted) {
            const quiz = user.quiz || {}
            if (!quiz.questions?.length)
                return res.status(500).json({ success: false, message: "No questions found to resume" })

            return res.status(200).json({
                success: true,
                message: "Quiz resumed",
                response: user.responses || [],
                quiz,
                timeUsed: user.timeUsed || 0
            })
        }

        const questions = await getRandomTest()
        if (!questions.length)
            return res.status(500).json({ success: false, message: "No questions available" })

        const quizMeta = await Quiz.findOne().select("title description duration")
        if (!quizMeta)
            return res.status(404).json({ success: false, message: "Quiz metadata not found" })

        user.quiz = {
            title: quizMeta.title,
            description: quizMeta.description,
            questions,
            duration: quizMeta.duration
        }
        user.hasStarted = true
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Quiz started",
            quiz: user.quiz
        })
    } catch (error) {
        console.error("❌ Start Quiz Error:", error)
        res.status(500).json({ success: false, message: "Internal server error" })
    }
}

export const submitQuiz = async (req, res) => {
    try {
        const { id, email } = req.user

        const { responses, timeUsed } = req.body

        if (!id || !email) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication details"
            })
        }

        if (!Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Responses must be a non-empty array"
            })
        }

        const user = await User.findOne({ _id: id, email })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        if (!user.quiz || !user.quiz.questions || user.quiz.questions.length === 0) {
            return res.status(500).json({
                success: false,
                message: "No quiz data found for user"
            })
        }

        if (!user.hasStarted) {
            return res.status(400).json({
                success: false,
                message: "Quiz has not been started"
            })
        }

        if (user.hasSubmitted) {
            return res.status(400).json({
                success: false,
                message: "Quiz already submitted"
            })
        }

        if (typeof timeUsed !== 'number' || timeUsed < 0 || timeUsed - 2 > user.quiz.duration) {
            return res.status(400).json({
                success: false,
                message: "Invalid time used"
            })
        }

        // calculate score
        let score = 0
        
        const quizAnswersMap = {}
        user.quiz.questions.forEach(q => {
            quizAnswersMap[q.id.toString()] = q.correctAnswers
        })

        responses.forEach(response => {
            const correctAnswer = quizAnswersMap[response.questionId.toString()]
            if (Number(response.selectedOption) === correctAnswer) {
                score++
            }
        })

        user.responses = responses
        user.score = score
        user.hasSubmitted = true
        user.timeUsed = timeUsed
        
        await user.save()

        res.clearCookie("token", {
            httpOnly: true,
        })

        return res.status(200).json({
            success: true,
            message: "Quiz submitted successfully and cookie cleared"
        })
    } catch (error) {
        console.error("Submit Quiz Error:", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}