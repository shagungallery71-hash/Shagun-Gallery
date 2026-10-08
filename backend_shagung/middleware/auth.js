import jwt from "jsonwebtoken";

// Any authenticated user (user or admin)
export const RequireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    // Check if token exists and is not 'undefined' or 'null' string
    if (!token || token === 'undefined' || token === 'null' || token.length < 10) {
      return res.status(401).json({
        success: false,
        message: "Invalid token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("❌ RequireAuth Error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Admin-only access
export const PermissionAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    // Check if token exists and is not 'undefined' or 'null' string
    if (!token || token === 'undefined' || token === 'null' || token.length < 10) {
      console.error("❌ PermissionAdmin: Invalid token received:", token);
      return res.status(401).json({
        success: false,
        message: "Invalid token provided. Please login again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    if (decoded.role?.toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    next();
  } catch (error) {
    console.error("❌ PermissionAdmin Error:", error.name, error.message);
    return res.status(403).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? "Token expired. Please login again." : "Invalid or expired token",
    });
  }
};

