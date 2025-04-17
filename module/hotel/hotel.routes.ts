import express from 'express';
import verifyUsers from '../../middleware/verifyUsers';
import optionalAuth from '../../middleware/optionalAuth';
import upload from '../../config/multer.config';
import { addHotel, getAllHotels, deleteHotel } from './hotel.controllers';

const router = express.Router();

router.post("/add", verifyUsers, upload.single("image"), addHotel);
router.get("/get", optionalAuth, getAllHotels);
router.delete("/delete/:id", verifyUsers, deleteHotel);

export default router;