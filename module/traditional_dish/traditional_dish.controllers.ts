import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getImageUrl } from "../../utils/base_utl";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const addTraditionalDish = async (req: Request, res: Response) => {
  try {
    const {
      name,
      price,
      numberOfReview,
      rating,
      bookingLink,
    } = req.body;
    const image = req.file?.filename;

    const requiredFields = [
      "name",
      "price",
      "numberOfReview",
      "rating",
      "bookingLink",
    ];
    const missing = requiredFields.find((field) => !req.body[field]);

    if (missing) {
      res.status(400).json({
        success: false,
        message: `${missing} is required!`,
      });
      return;
    }

    if (!image) {
      res.status(400).json({ success: false, message: "Image is required!" });
      return;
    }

    const newDish = await prisma.traditionalDish.create({
      data: {
        name,
        price,
        numberOfReview,
        rating,
        bookingLink,
        image,
      },
    });

    res.status(201).json({
      success: true,
      message: "Traditional dish added successfully",
      data: {
        ...newDish,
        image: getImageUrl(newDish.image),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const deleteTraditionalDish = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingDish = await prisma.traditionalDish.findUnique({ where: { id } });

    if (!existingDish) {
      res.status(404).json({
        success: false,
        message: "Traditional dish not found",
      });
      return;
    }

    await prisma.traditionalDish.delete({ where: { id } });

    if (existingDish.image) {
      const imagePath = path.join(
        __dirname,
        "../../uploads",
        existingDish.image
      );

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete image file:", err);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Traditional dish deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

// export const getAllTraditionalDishes = async (req: Request, res: Response) => {
//   try {
//     const {
//       name,
//       minPrice,
//       maxPrice,
//       numberOfReview,
//       rating,
//       bookingLink,
//       search,
//       page = "1",
//       limit = "10",
//     } = req.query;

//     const pageNumber = parseInt(page as string, 10);
//     const take = parseInt(limit as string, 10);
//     const skip = (pageNumber - 1) * take;

//     const filters: any = {
//       ...(name && { name: { contains: String(name), mode: "insensitive" } }),
//       ...(minPrice && { price: { gte: parseFloat(String(minPrice)) } }),
//       ...(maxPrice && { price: { lte: parseFloat(String(maxPrice)) } }),
//       ...(numberOfReview && { numberOfReview: String(numberOfReview) }),
//       ...(rating && { rating: String(rating) }),
//       ...(bookingLink && { bookingLink: { contains: String(bookingLink), mode: "insensitive" } }),
//       ...(search && {
//         OR: [
//           { name: { contains: String(search), mode: "insensitive" } },
//           { bookingLink: { contains: String(search), mode: "insensitive" } },
//           { price: { contains: String(search), mode: "insensitive" } },
//         ],
//       }),
//     };

//     const [dishes, totalCount] = await Promise.all([
//       prisma.traditionalDish.findMany({
//         where: filters,
//         orderBy: { createdAt: "desc" },
//         skip,
//         take,
//       }),
//       prisma.traditionalDish.count({ where: filters }),
//     ]);

//     const formattedDishes = dishes.map((dish) => ({
//       ...dish,
//       image: getImageUrl(dish.image),
//     }));

//     const totalPages = take ? Math.ceil(totalCount / take) : 1;

//     res.status(200).json({
//       success: true,
//       message: "Traditional dishes fetched successfully",
//       data: formattedDishes,
//       pagination: {
//         totalData: totalCount,
//         page: pageNumber,
//         totalPages,
//         nextPage: take ? pageNumber < totalPages : false,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error instanceof Error ? error.message : "Internal server error",
//     });
//   }
// };



export const getAllTraditionalDishes = async (req: Request, res: Response) => {
  try {
    const {
      name,
      minPrice,
      maxPrice,
      numberOfReview,
      rating,
      bookingLink,
      search,
      page = "1",
      limit = "10",
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const take = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * take;

    const filters: any = {
      ...(name && { name: { contains: String(name), mode: "insensitive" } }),
      ...(minPrice && { price: { gte: parseFloat(String(minPrice)) } }),
      ...(maxPrice && { price: { lte: parseFloat(String(maxPrice)) } }),
      ...(numberOfReview && { numberOfReview: String(numberOfReview) }),
      ...(rating && { rating: String(rating) }),
      ...(bookingLink && { bookingLink: { contains: String(bookingLink), mode: "insensitive" } }),
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: "insensitive" } },
          { bookingLink: { contains: String(search), mode: "insensitive" } },
        ],
      }),
    };

    const [dishes, totalCount] = await Promise.all([
      prisma.traditionalDish.findMany({
        where: filters,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.traditionalDish.count({ where: filters }),
    ]);

    let favoriteIdsSet = new Set<string>();

    if ((req as any).user) {
      const userId = (req as any).user.id;

      const userFavorites = await prisma.favorite.findMany({
        where: {
          userId,
          entityType: "DISH",
          entityId: { in: dishes.map((dish) => dish.id) },
        },
        select: { entityId: true },
      });

      favoriteIdsSet = new Set(userFavorites.map((fav) => fav.entityId));
    }

    const formattedDishes = dishes.map((dish) => ({
      ...dish,
      image: getImageUrl(dish.image),
      isFavorite: favoriteIdsSet.has(dish.id),
    }));

    const totalPages = take ? Math.ceil(totalCount / take) : 1;

    res.status(200).json({
      success: true,
      message: "Traditional dishes fetched successfully",
      data: formattedDishes,
      pagination: {
        totalData: totalCount,
        page: pageNumber,
        totalPages,
        nextPage: take ? pageNumber < totalPages : false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
