import { User } from "../models/User.js"
import { Quiz } from "../models/Quiz.js"

export const googleAuth = (req, res, next) => {
    try {
        //google login 
        //email verify
        //?issue cookie
        //generate and set unique quiz for user
        //:return invalid email
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

const getRandomTest = async () => {
    try {
        const quiz = await Quiz.findOne().select("questions")

        if (!quiz || !quiz.questions.length) {
            return res.status(404).json({
                success: false,
                message: "No questions available"
            })
        }

        const questions = [...quiz.questions]

        // fisher–Yates algorithm
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[questions[i], questions[j]] = [questions[j], questions[i]]
        }

        const selectedQuestions = questions.slice(0, 15).map(q => ({
            id: q._id,
            question: q.question,
            options: q.options,
            image: q.image || null
        }))

        return selectedQuestions
    } catch (error) {
        console.error("Get Random Test Error:", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const startQuiz = async (req, res) => {
    try {
        const { id, email } = req.user

        if (!id || !email) {
            return res.status(400).json({
                success: false,
                message: "Invalid authentication details"
            })
        }
        
        const user = await User.findOne({ _id: id, email })

        if (user.hasSubmitted) {
            return res.status(400).json({
                success: false,
                message: "Quiz already submitted"
            })
        }
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        
        if (user.hasStarted && !user.hasSubmitted) {
            const quiz = user.quiz || {}
            if (quiz.questions.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: "No questions found to resume"
                })
            }
            return res.status(200).json({
                success: true,
                message: "Quiz resumed",
                response: user.responses || [],
                quiz,
                timeUsed: user.timeUsed || 0
            })
        }
        
        const questions = await getRandomTest()

        if (!questions || questions.length === 0) {
            return res.status(500).json({
                success: false,
                message: "No questions available"
            })
        }

        const quiz = await Quiz.findOne().select("title description duration")

        user.quiz = {
            title: quiz.title,
            description: quiz.description,
            questions,
            duration: quiz.duration
        }
        user.hasStarted = true
        
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Quiz started",
            quiz: user.quiz
        })
    } catch (error) {
        console.error("Start Quiz Error:", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
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

