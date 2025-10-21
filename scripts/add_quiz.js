import mongoose from "mongoose"
import { Quiz } from "../models/quiz.model.js"
import dotenv from "dotenv"

dotenv.config()

const MONGO_URI = process.env.MONGO_URI

console.log(MONGO_URI);


const sampleQuestions = [
    {
        question: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(n²)"],
        answer: "O(log n)",
        image:"https://zvsbe.com",
        correctAnswers: 1
    },
    {
        question: "Which sorting algorithm has the worst time complexity?",
        options: ["Quick Sort", "Merge Sort", "Bubble Sort", "Heap Sort"],
        answer: "Bubble Sort",
        image:"https://zvsbe.com",
        correctAnswers: 2
    },
    {
        question: "What is the primary purpose of useEffect in React?",
        options: [
            "To handle side effects",
            "To create components",
            "To style elements",
            "To manage state"
        ],
        answer: "To handle side effects",
        correctAnswers: 0
    },
    {
        question: "What does REST stand for in API development?",
        options: [
            "Representational State Transfer",
            "Remote Endpoint Secure Transfer",
            "React Express State Transfer",
            "Remote Execution State Time"
        ],
        answer: "Representational State Transfer",
        correctAnswers: 0
    },
    {
        question: "Which of these is not a valid HTTP method?",
        options: ["GET", "POST", "SEND", "PUT"],
        answer: "SEND",
        correctAnswers: 2
    },
    {
        question: "What is the purpose of JWT?",
        options: [
            "Data encryption",
            "User authentication",
            "Database management",
            "Server configuration"
        ],
        answer: "User authentication",
        correctAnswers: 1
    },
    {
        question: "What is Node.js?",
        options: [
            "A frontend framework",
            "A runtime environment",
            "A database system",
            "A programming language"
        ],
        answer: "A runtime environment",
        correctAnswers: 1
    },
    {
        question: "Which of these is a NoSQL database?",
        options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
        answer: "MongoDB",
        correctAnswers: 2
    },
    {
        question: "What is the purpose of useState in React?",
        options: [
            "Route management",
            "State management",
            "API calls",
            "Component styling"
        ],
        answer: "State management",
        correctAnswers: 1
    },
    {
        question: "What is Redux used for?",
        options: [
            "Global state management",
            "Database queries",
            "Server-side rendering",
            "Form validation"
        ],
        answer: "Global state management",
        correctAnswers: 0
    },
    {
        question: "What is CORS?",
        options: [
            "Cross-Origin Resource Sharing",
            "Component Object Request Service",
            "Create Object Response System",
            "Cross-Object Request Service"
        ],
        answer: "Cross-Origin Resource Sharing",
        correctAnswers: 0
    },
    {
        question: "Which hook is used for context in React?",
        options: ["useState", "useEffect", "useContext", "useReducer"],
        answer: "useContext",
        correctAnswers: 2
    },
    {
        question: "What is the purpose of git merge?",
        options: [
            "Create new branch",
            "Combine branches",
            "Delete branch",
            "Update remote"
        ],
        answer: "Combine branches",
        correctAnswers: 1
    },
    {
        question: "What is a closure in JavaScript?",
        options: [
            "A function with access to outer scope",
            "A class definition",
            "An object literal",
            "A loop structure"
        ],
        answer: "A function with access to outer scope",
        correctAnswers: 0
    },
    {
        question: "What is the purpose of Docker?",
        options: [
            "Database management",
            "Version control",
            "Container virtualization",
            "Code editing"
        ],
        answer: "Container virtualization",
        correctAnswers: 2
    },
    {
        question: "What is a Promise in JavaScript?",
        options: [
            "Asynchronous operation handler",
            "Data type",
            "Loop structure",
            "Function declaration"
        ],
        answer: "Asynchronous operation handler",
        correctAnswers: 0
    },
    {
        question: "What does CSS stand for?",
        options: [
            "Computer Style Sheets",
            "Cascading Style Sheets",
            "Creative Style System",
            "Content Styling Service"
        ],
        answer: "Cascading Style Sheets",
        correctAnswers: 1
    },
    {
        question: "What is NPM?",
        options: [
            "Node Package Manager",
            "New Programming Method",
            "Network Protocol Management",
            "Node Process Monitor"
        ],
        answer: "Node Package Manager",
        correctAnswers: 0
    },
    {
        question: "What is the purpose of async/await?",
        options: [
            "Handle promises",
            "Create objects",
            "Style components",
            "Manage state"
        ],
        answer: "Handle promises",
        correctAnswers: 0
    },
    {
        question: "What is GraphQL?",
        options: [
            "Database system",
            "Query language for APIs",
            "JavaScript framework",
            "CSS preprocessor"
        ],
        answer: "Query language for APIs",
        correctAnswers: 1
    },
    {
        question: "What is the purpose of TypeScript?",
        options: [
            "Add type safety to JavaScript",
            "Replace JavaScript",
            "Create UI components",
            "Handle API calls"
        ],
        answer: "Add type safety to JavaScript",
        correctAnswers: 0
    },
    {
        question: "What is a middleware in Express?",
        options: [
            "Database connection",
            "Request/response handler",
            "Frontend component",
            "Testing framework"
        ],
        answer: "Request/response handler",
        correctAnswers: 1
    },
    {
        question: "What is the purpose of useRef in React?",
        options: [
            "Mutable value reference",
            "State management",
            "API calls",
            "Event handling"
        ],
        answer: "Mutable value reference",
        correctAnswers: 0
    },
    {
        question: "What is the purpose of webpack?",
        options: [
            "Module bundling",
            "Database management",
            "Server hosting",
            "API testing"
        ],
        answer: "Module bundling",
        correctAnswers: 0
    },
    {
        question: "What is the Virtual DOM?",
        options: [
            "Real DOM copy",
            "Browser feature",
            "Database type",
            "CSS framework"
        ],
        answer: "Real DOM copy",
        correctAnswers: 0
    },
    {
        question: "What is the purpose of .gitignore?",
        options: [
            "Exclude files from git",
            "Configure git",
            "Track files in git",
            "Delete git files"
        ],
        answer: "Exclude files from git",
        correctAnswers: 0
    },
    {
        question: "What is Redux Thunk used for?",
        options: [
            "Async actions in Redux",
            "State management",
            "Component styling",
            "Route handling"
        ],
        answer: "Async actions in Redux",
        correctAnswers: 0
    },
    {
        question: "What is the purpose of key prop in React?",
        options: [
            "Unique list item identifier",
            "Styling elements",
            "Event handling",
            "State management"
        ],
        answer: "Unique list item identifier",
        correctAnswers: 0
    },
    {
        question: "What is MongoDB's primary data structure?",
        options: [
            "Tables",
            "Documents",
            "Arrays",
            "Trees"
        ],
        answer: "Documents",
        correctAnswers: 1
    },
    {
        question: "What is JWT authentication flow?",
        options: [
            "Login → Get Token → Use Token in Headers",
            "Login → Get Password → Use Password",
            "Register → Get Key → Use Key",
            "Connect → Get Session → Use Session"
        ],
        answer: "Login → Get Token → Use Token in Headers",
        correctAnswers: 0
    }
]

const quizData = {
    title: "Technical Assessment Quiz",
    description: "This quiz tests your knowledge of modern web development concepts, tools, and best practices.",
    duration: 15,
    questions: sampleQuestions
}

const addQuiz = async () => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log("✅ Connected to MongoDB")

        const existing = await Quiz.findOne({ title: quizData.title })
        if (existing) {
            console.log("⚠️  A quiz with this title already exists. Deleting it...")
            await Quiz.deleteOne({ title: quizData.title })
        }

        const quiz = new Quiz(quizData)
        await quiz.save()

        console.log("🎉 Sample quiz added successfully!")
        console.log(`📝 Quiz ID: ${quiz._id}`)
    } catch (err) {
        console.error("❌ Error adding quiz:", err)
    } finally {
        await mongoose.disconnect()
        console.log("🔌 Disconnected from MongoDB")
    }
}

addQuiz()
