import express from "express";
import verifyUser from "../../middleware/verifyUsers";
import upload from "../../config/multer.config";
import { addRestaurant, deleteRestaurant, getAllRestaurants } from "./restaurant.controllers";
import optionalAuth from "../../middleware/optionalAuth";

const router = express.Router();

router.post("/add", verifyUser, upload.single("image"), addRestaurant);
router.get("/get", optionalAuth, getAllRestaurants);
router.delete("/delete/:id", verifyUser, deleteRestaurant);

export default router;