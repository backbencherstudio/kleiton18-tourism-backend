"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyUsers_1 = __importDefault(require("../../middleware/verifyUsers"));
const favorite_controllers_1 = require("./favorite.controllers");
const router = express_1.default.Router();
router.post("/add", verifyUsers_1.default, favorite_controllers_1.addToFavorites);
router.delete("/remove/:entityId/:entityType", verifyUsers_1.default, favorite_controllers_1.removeFromFavorites);
router.get("/list", verifyUsers_1.default, favorite_controllers_1.getUserFavorites);
exports.default = router;
//# sourceMappingURL=favorite.routes.js.map