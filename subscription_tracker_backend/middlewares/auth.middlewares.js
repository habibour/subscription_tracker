import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import User from "../models/users.models.js";

const authorize = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authorize;

// comment what it does
// This middleware function 'authorize' checks for a valid JWT token in the request headers or cookies.
// If a valid token is found, it decodes the token to retrieve the user ID and allows the request to proceed.
// If no token is found or if the token is invalid/expired, it responds with a 401 Unauthorized status.
