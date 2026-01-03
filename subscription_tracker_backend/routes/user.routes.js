import { Router } from "express";
import { getAllUsers, getUserById } from "../controllers/user.controller.js";
import authorize from "../middlewares/auth.middlewares.js";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:userId", authorize, getUserById);

userRouter.post("/", (req, res) => {
  // Handle creating a new user
  res.send("Create a new user");
});

userRouter.put("/:userId", (req, res) => {
  // Handle updating user details
  res.send(`Update user details for user ID: ${req.params.userId}`);
});

userRouter.delete("/:userId", (req, res) => {
  // Handle deleting a user
  res.send(`Delete user with user ID: ${req.params.userId}`);
});

export default userRouter;
