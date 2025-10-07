import { User } from "../models/User.js"
import { Quiz } from "../models/Quiz.js"

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


export const getRandomTest = async (req, res) => {
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

        res.status(200).json({
            success: true,
            questions: selectedQuestions
        })
    } catch (error) {
        console.error("Get Random Test Error:", error)
        res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

