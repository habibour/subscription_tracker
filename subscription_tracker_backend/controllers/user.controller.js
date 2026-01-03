import users from "../models/users.models.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await users.find({});
    res.status(200).json({
      success: true,
      data: allUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
