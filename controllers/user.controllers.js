import { User } from "../models/user.model.js";
import { Quiz } from "../models/quiz.model.js";
import { Allowed } from "../models/allowed.model.js";
import { generateToken } from "../middlewares/auth.middleware.js"
import { z } from "zod"

const googleAuthSchema = z.object({
  email: z.string().email().max(254)
})

// New Firebase authentication endpoint
export const firebaseAuth = async (req, res, next) => {
  try {
    // Firebase user info is already verified by middleware
    const { uid, email, name, emailVerified } = req.firebaseUser;

    if (!email || !uid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Firebase user data"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is allowed
    const find = await Allowed.findOne({ email: normalizedEmail });

    if (!find) {
      return res.status(403).json({
        success: false,
        message: "Email is not allowed"
      });
    }

    // Check if user exists by Firebase UID or email
    let existingUser = await User.findOne({ 
      $or: [
        { firebaseUid: uid },
        { email: normalizedEmail }
      ]
    });

    if (existingUser) {
      // Update Firebase UID if missing
      if (!existingUser.firebaseUid) {
        existingUser.firebaseUid = uid;
        await existingUser.save();
      }

      const hasStarted = existingUser.hasStarted && !existingUser.hasSubmitted;
      const token = generateToken(existingUser);

      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({
        success: true,
        message: "User authenticated successfully",
        user: {
          uid: existingUser.firebaseUid,
          email: existingUser.email,
          name: existingUser.name,
          isResuming: hasStarted
        }
      });
    }

    // Create new user
    const newUser = new User({
      firebaseUid: uid,
      name: name || find.name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      hasStarted: false,
      hasSubmitted: false,
      phone: find.phone || null,
      score: 0,
      timeUsed: 0,
      quiz: null,
      responses: [],
      qualifiedForInterview: false
    });

    await newUser.save();

    const token = generateToken(newUser);

    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "User created and authenticated successfully",
      user: {
        uid: newUser.firebaseUid,
        email: newUser.email,
        name: newUser.name,
        isResuming: false
      }
    });
  } catch (error) {
    console.error("Firebase Auth Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication"
    });
  }
};

// Legacy Google auth endpoint (deprecated - use firebaseAuth instead)
export const googleAuth = async (req, res, next) => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid input" })
    }
    const { email } = parsed.data

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

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const hasStarted = existingUser.hasStarted && !existingUser.hasSubmitted;
      const token = generateToken(existingUser);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
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
    });

    await newUser.save();

    const token = generateToken(newUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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
    console.error("Google Auth Error:", error);
    res.status(500).json({
      error: error,
      success: false,

      message: "hello"
    });
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const { id, email } = req.user;

    if (!id || !email) {
      return res.status(400).json({
        success: false,
        message: "Invalid authentication details"
      });
    }

    const user = await User.findOne({ _id: id, email }).select("name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Get User Info Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });

    // Also clear legacy token cookie for backward compatibility
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const verifyAuth = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user.id,
      email: req.user.email
    }).select("name email hasStarted hasSubmitted");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
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
    console.error("Verify Auth Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getRandomTest = async (limit = 15) => {
  try {
    const quiz = await Quiz.findOne().select("questions").lean();
    if (!quiz || !quiz.questions?.length) return [];

    const questions = [...quiz.questions];
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions.slice(0, limit).map(q => ({
      id: q._id.toString(),
      question: q.question,
      options: q.options,
      image: q.image || null,
      correctAnswers: q.correctAnswers,  
      answer: q.answer                  
    }));
  } catch (error) {
    console.error("getRandomTest Error:", error);
    return [];
  }
};

export const startQuiz = async (req, res) => {
  try {
    const { id, email } = req.user || {};

    if (!id || !email) {
      return res.status(400).json({
        success: false,
        message: "Invalid authentication details"
      });
    }

    const user = await User.findOne({ _id: id, email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.hasSubmitted) {
      return res.status(400).json({
        success: false,
        message: "Quiz already submitted"
      });
    }

    if (user.hasStarted && !user.hasSubmitted && user.quiz) {
      const storedQuiz = user.quiz.toObject ? user.quiz.toObject() : user.quiz;

      if (!storedQuiz?.questions?.length) {
        return res.status(500).json({
          success: false,
          message: "No questions found to resume"
        });
      }

      const publicQuiz = {
        title: storedQuiz.title,
        description: storedQuiz.description,
        duration: storedQuiz.duration,
        questions: storedQuiz.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          image: q.image || null
        }))
      };

      return res.status(200).json({
        success: true,
        message: "Quiz resumed",
        responses: user.responses || [],
        quiz: publicQuiz,
        timeUsed: user.timeUsed || 0
      });
    }

    const questions = await getRandomTest();
    if (!questions.length) {
      return res.status(500).json({
        success: false,
        message: "No questions available"
      });
    }

    const quizMeta = await Quiz.findOne().select("title description duration").lean();
    if (!quizMeta) {
      return res.status(404).json({
        success: false,
        message: "Quiz metadata not found"
      });
    }

    user.quiz = {
      title: quizMeta.title,
      description: quizMeta.description,
      duration: quizMeta.duration,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        image: q.image || null,
        correctAnswers: q.correctAnswers,
        answer: q.answer
      }))
    };
    user.hasStarted = true;
    user.responses = [];
    user.timeUsed = 0;

    await user.save();

    const publicQuiz = {
      title: quizMeta.title,
      description: quizMeta.description,
      duration: quizMeta.duration,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        image: q.image || null
      }))
    };

    return res.status(200).json({
      success: true,
      message: "Quiz started",
      quiz: publicQuiz
    });
  } catch (error) {
    console.error("Start Quiz Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const quizSubmissionSchema = z.object({
  responses: z.array(
    z.object({
      questionId: z.string().min(1, "Question ID required"),
      selectedOption: z.number().int().nonnegative().optional()
    })
  ).nonempty("Responses must be a non-empty array"),
  timeUsed: z.number().nonnegative()
})

function buildQuizAnswerMap(questions = []) {
  const map = {}
  for (const q of questions) {
    if (!q?.id) continue
    map[q.id.toString()] = {
      correctIndex: q.correctAnswers,
      correctText: q.answer,
      options: q.options || []
    }
  }
  return map
}

function evaluateResponses(responses, quizAnswersMap) {
  let score = 0
  const evaluated = []

  for (const r of responses) {
    const qid = String(r.questionId)
    const selectedIndex = Number.isInteger(r.selectedOption) ? r.selectedOption : -1
    const questionData = quizAnswersMap[qid]

    if (!questionData) {
      evaluated.push({ questionId: qid, selectedOption: String(selectedIndex) })
      continue
    }

    const { correctIndex, correctText, options } = questionData
    const selectedText = options[selectedIndex]
    let isCorrect = false

    if (typeof correctIndex === "number" && correctIndex >= 0) {
      isCorrect = selectedIndex === correctIndex
    } else if (correctText && selectedText) {
      isCorrect = correctText.trim().toLowerCase() === selectedText.trim().toLowerCase()
    }

    if (isCorrect) score++

    evaluated.push({
      questionId: qid,
      selectedOption: String(selectedIndex)
    })
  }

  return { score, evaluated }
}

export const submitQuiz = async (req, res) => {
  try {
    const { id, email } = req.user || {}
    if (!id || !email) {
      return res.status(400).json({ success: false, message: "Invalid authentication details" })
    }

    const parseResult = quizSubmissionSchema.safeParse(req.body)
    if (!parseResult.success) {
      const message = (parseResult.error.issues || []).map(e => e.message).join(", ")
      return res.status(400).json({ success: false, message })
    }

    const { responses, timeUsed } = parseResult.data

    const user = await User.findOne({ _id: id, email })
    if (!user) return res.status(404).json({ success: false, message: "User not found" })

    if (!user.quiz || !Array.isArray(user.quiz.questions) || user.quiz.questions.length === 0) {
      return res.status(400).json({ success: false, message: "Quiz not assigned to user" })
    }

    if (!user.hasStarted) {
      return res.status(400).json({ success: false, message: "Quiz has not been started" })
    }

    if (user.hasSubmitted) {
      return res.status(400).json({ success: false, message: "Quiz already submitted" })
    }

    const maxAllowedTime = user.quiz.duration * 60
    if (timeUsed < 0 || timeUsed > maxAllowedTime + 2) {
      return res.status(400).json({ success: false, message: "Invalid time used" })
    }

    const quizAnswersMap = buildQuizAnswerMap(user.quiz.questions)
    const { score, evaluated } = evaluateResponses(responses, quizAnswersMap)


    user.responses = evaluated
    user.score = score
    user.hasSubmitted = true
    user.timeUsed = timeUsed
    user.submittedAt = new Date()

    await user.save()

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    })

    return res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      data: {
        totalQuestions: user.quiz.questions.length,
        attempted: evaluated.filter(r => Number(r.selectedOption) !== -1).length,
        timeUsed
      }
    })
  } catch (error) {
    console.error("Submit Quiz Error:", error)
    return res.status(500).json({ success: false, message: "Internal server error" })
  }
}