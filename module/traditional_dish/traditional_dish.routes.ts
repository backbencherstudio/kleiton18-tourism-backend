import express from "express";
import verifyUser from "../../middleware/verifyUsers";
import upload from "../../config/multer.config";
import { addTraditionalDish, deleteTraditionalDish, getAllTraditionalDishes } from "./traditional_dish.controllers";
import optionalAuth from "../../middleware/optionalAuth";

const router = express.Router();

router.post("/add", verifyUser, upload.single("image"), addTraditionalDish);
router.get("/get", optionalAuth, getAllTraditionalDishes);
router.delete("/delete/:id", verifyUser, deleteTraditionalDish);

export default router;