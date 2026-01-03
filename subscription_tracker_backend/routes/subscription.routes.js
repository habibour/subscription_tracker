import { Router } from "express";
import authorize from "../middlewares/auth.middlewares.js";
import {
  createSubscription,
  getUserSubscriptions,
  deleteSubscription,
} from "../controllers/subscriptions.controllers.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", (req, res) => {
  // Handle fetching all subscriptions
  res.send("List of subscriptions");
});

subscriptionRouter.get("/user/:userId", authorize, getUserSubscriptions);

subscriptionRouter.post("/", authorize, createSubscription);

subscriptionRouter.put("/:subscriptionId", (req, res) => {
  // Handle updating subscription details
  res.send(
    `Update subscription details for subscription ID: ${req.params.subscriptionId}`
  );
});

subscriptionRouter.delete("/:subscriptionId", authorize, deleteSubscription);

export default subscriptionRouter;
