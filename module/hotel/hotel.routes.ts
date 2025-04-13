import express from "express";

import verifyUser from "../../middleware/verifyUsers";
import upload from "../../config/multer.config";
import { addHotel, deleteHotel, getAllHotels } from "./hotel.controllers";


const router = express.Router();


router.post("/add", verifyUser, upload.single("image"), addHotel);
router.get("/get", getAllHotels)
router.delete("/delete/:id", verifyUser, deleteHotel)



export default router;