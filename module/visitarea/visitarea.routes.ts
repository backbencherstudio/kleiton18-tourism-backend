import express from "express";
import verifyUser from "../../middleware/verifyUsers";
import upload from "../../config/multer.config";
import { addVisitArea, deleteVisitArea, getAllVisitAreas } from "./visitarea.controllers";

const router = express.Router();

router.post("/add", verifyUser, upload.single("image"), addVisitArea);
router.get("/get", getAllVisitAreas);
router.delete("/delete/:id", verifyUser, deleteVisitArea);

export default router;