import express from "express";
import verifyUser from "../../middleware/verifyUsers";
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
} from "./favorite.controllers";

const router = express.Router();

router.post("/add", verifyUser, addToFavorites);

router.delete("/remove/:entityId/:entityType", verifyUser, removeFromFavorites);

// Keep the general list endpoint for backward compatibility
router.get("/list", verifyUser, getUserFavorites);

export default router;
