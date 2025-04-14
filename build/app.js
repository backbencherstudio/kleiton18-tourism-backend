"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const users_routes_1 = __importDefault(require("./module/users/users.routes"));
// import products from "./module/products/products.routes";
const hotel_routes_1 = __importDefault(require("./module/hotel/hotel.routes"));
const restaurant_routes_1 = __importDefault(require("./module/restaurant/restaurant.routes"));
const traditional_dish_routes_1 = __importDefault(require("./module/traditional_dish/traditional_dish.routes"));
const path_1 = __importDefault(require("path"));
const visitarea_routes_1 = __importDefault(require("./module/visitarea/visitarea.routes"));
const favorite_routes_1 = __importDefault(require("./module/favorite/favorite.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [
        "http://192.168.30.102:3000",
        "http://192.168.30.102:*",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:*",
        'http://192.168.30.102:3000',
        "http://192.168.30.102:3001",
        "http://192.168.30.102:3003",
        "http://192.168.40.47:3004",
        "http://192.168.30.102:*",
        "http://localhost:3002",
        "http://192.168.40.10:4000",
    ],
}));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
app.use("/users", users_routes_1.default);
app.use("/hotel", hotel_routes_1.default);
app.use("/restaurant", restaurant_routes_1.default);
app.use('/traditional-dish', traditional_dish_routes_1.default);
app.use("/visit-area", visitarea_routes_1.default);
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "uploads")));
app.use("/favorites", favorite_routes_1.default);
app.use((req, res, next) => {
    res.status(404).json({
        message: `404 route not found`,
    });
});
app.use((err, req, res, next) => {
    res.status(500).json({
        message: `500 Something broken!`,
        error: err.message,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map