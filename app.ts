import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";

import users from "./module/users/users.routes";
// import products from "./module/products/products.routes";
import hotel from "./module/hotel/hotel.routes"
import restaurantRoutes from "./module/restaurant/restaurant.routes";
import TraditionalDish from "./module/traditional_dish/traditional_dish.routes";
import path from "path";
import visitAreaRoutes from "./module/visitarea/visitarea.routes";
import favoriteRoutes from "./module/favorite/favorite.routes";



const app = express();

app.use(
  cors({
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
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));


app.use("/users", users);
app.use("/hotel", hotel);
app.use("/restaurant", restaurantRoutes);
app.use('/traditional-dish', TraditionalDish)
app.use("/visit-area", visitAreaRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/favorites", favoriteRoutes);


app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: `404 route not found`,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    message: `500 Something broken!`,
    error: err.message,
  });
});

export default app;