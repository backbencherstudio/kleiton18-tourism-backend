import express from "express";
import verifyUser from "../../middleware/verifyUsers";
import upload from "../../config/multer.config";
import { addTraditionalDish, deleteTraditionalDish, getAllTraditionalDishes } from "./traditional_dish.controllers";

const router = express.Router();

router.post("/add", verifyUser, upload.single("image"), addTraditionalDish);
router.get("/get", getAllTraditionalDishes);
router.delete("/delete/:id", verifyUser, deleteTraditionalDish);

export default router;