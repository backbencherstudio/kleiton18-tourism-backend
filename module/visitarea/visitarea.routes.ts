import express from "express";
import verifyUser from "../../middleware/verifyUsers";
import upload from "../../config/multer.config";
import { addVisitArea, deleteVisitArea, getAllVisitAreas } from "./visitarea.controllers";
import optionalAuth from "../../middleware/optionalAuth";

const router = express.Router();

router.post("/add", verifyUser, upload.single("image"), addVisitArea);
router.get("/get", optionalAuth, getAllVisitAreas);
router.delete("/delete/:id", verifyUser, deleteVisitArea);

export default router;