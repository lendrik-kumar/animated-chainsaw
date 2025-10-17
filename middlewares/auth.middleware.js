import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES = "7d";
const ADMIN_JWT_EXPIRES = "24h";

export const generateToken = (user) => {
  if (!user || !user._id || !user.email) {
    throw new Error("Invalid user data for token generation");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
};

export const generateAdminToken = () => {
  return jwt.sign(
    {
      role: "admin",
      isAdmin: true,
    },
    JWT_SECRET,
    { expiresIn: ADMIN_JWT_EXPIRES }
  );
};

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    if (!decoded || !decoded.id || !decoded.email) {
      return res.status(403).json({
        success: false,
        message: "Token does not contain valid user data",
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
};

export const adminAuthMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication token missing",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired admin token",
      });
    }

    if (!decoded || !decoded.isAdmin || decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin access required",
      });
    }

    req.admin = {
      role: decoded.role,
      isAdmin: decoded.isAdmin,
    };

    next();
  } catch (error) {
    console.error("Admin Auth Middleware Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during admin authentication",
    });
  }
};