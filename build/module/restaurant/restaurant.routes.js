"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyUsers_1 = __importDefault(require("../../middleware/verifyUsers"));
const multer_config_1 = __importDefault(require("../../config/multer.config"));
const restaurant_controllers_1 = require("./restaurant.controllers");
const router = express_1.default.Router();
router.post("/add", verifyUsers_1.default, multer_config_1.default.single("image"), restaurant_controllers_1.addRestaurant);
router.get("/get", restaurant_controllers_1.getAllRestaurants);
router.delete("/delete/:id", verifyUsers_1.default, restaurant_controllers_1.deleteRestaurant);
exports.default = router;
//# sourceMappingURL=restaurant.routes.js.map