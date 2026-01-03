import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import User from "../models/users.models.js";

export const signup = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "Username, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create(
      [{ username, email, password: hashedPassword }],
      { session }
    );

    const token = jwt.sign({ userId: newUser[0]._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: newUser[0]._id,
        username: newUser[0].username,
        email: newUser[0].email,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({
      message: "Sign in successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    // Since JWT is stateless, signout is handled on the client side
    // by removing the token. This endpoint is just for confirmation.
    res.status(200).json({ message: "Sign out successful" });
  } catch (error) {
    next(error);
  }
};
