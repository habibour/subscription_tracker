import aj from "../config/arcjet.js";

const arcjetMiddleware = async (req, res, next) => {
  try {
    // Create a properly formatted request for Arcjet
    const decision = await aj.protect(req, {
      requested: 1, // Number of tokens requested
    });

    console.log("Arcjet Decision:", {
      conclusion: decision.conclusion,
      reason: decision.reason,
      ip: decision.ip,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      }

      if (decision.reason.isBot()) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Bot traffic is not allowed.",
        });
      }
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    next();
  } catch (error) {
    console.error("Arcjet Middleware Error:", error);
    next(error);
  }
};

export default arcjetMiddleware;
// This middleware function 'arcjetMiddleware' uses the Arcjet security service to inspect incoming requests.
// It checks if the request should be denied based on predefined security rules such as rate limiting and bot detection.
// If the request is denied, it responds with appropriate HTTP status codes (429 for too many requests, 403 for bot traffic).
// If the request passes the inspection, it allows the request to proceed to the next middleware or route handler.
