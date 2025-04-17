import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getImageUrl } from "../../utils/base_utl";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const addRestaurant = async (req: Request, res: Response) => {
  try {
    const {
      name,
      location,
      numberOfReview,
      rating,
      openTime,
      closeTime,
      details,
      bookingLink,
    } = req.body;
    const image = req.file?.filename;

    const requiredFields = [
      "name",
      "location",
      "numberOfReview",
      "rating",
      "openTime",
      "closeTime",
      "details",
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

    const newRestaurant = await prisma.restaurant.create({
      data: {
        name,
        location,
        numberOfReview,
        rating,
        openTime,
        closeTime,
        details,
        bookingLink,
        image,
      },
    });

    res.status(201).json({
      success: true,
      message: "Restaurant added successfully",
      data: {
        ...newRestaurant,
        image: getImageUrl(newRestaurant.image),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const deleteRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const existingRestaurant = await prisma.restaurant.findUnique({ where: { id } });

    if (!existingRestaurant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
      return;
    }

    await prisma.restaurant.delete({ where: { id } });

    if (existingRestaurant.image) {
      const imagePath = path.join(
        __dirname,
        "../../uploads",
        existingRestaurant.image
      );

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete image file:", err);
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};


// export const getAllRestaurants = async (req: Request, res: Response) => {
//   try {
//     const {
//       name,
//       location,
//       numberOfReview,
//       rating,
//       openTime,
//       closeTime,
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
//       ...(location && { location: { contains: String(location), mode: "insensitive" } }),
//       ...(numberOfReview && { numberOfReview: String(numberOfReview) }),
//       ...(rating && { rating: String(rating) }),
//       ...(openTime && { openTime: String(openTime) }),
//       ...(closeTime && { closeTime: String(closeTime) }),
//       ...(bookingLink && { bookingLink: { contains: String(bookingLink), mode: "insensitive" } }),
//       ...(search && {
//         OR: [
//           { name: { contains: String(search), mode: "insensitive" } },
//           { location: { contains: String(search), mode: "insensitive" } },
//           { details: { contains: String(search), mode: "insensitive" } },
//         ],
//       }),
//     };

//     const [restaurants, totalCount] = await Promise.all([
//       prisma.restaurant.findMany({
//         where: filters,
//         orderBy: { createdAt: "desc" },
//         skip,
//         take,
//       }),
//       prisma.restaurant.count({ where: filters }),
//     ]);

//     const formattedRestaurants = restaurants.map((restaurant) => ({
//       ...restaurant,
//       image: getImageUrl(restaurant.image),
//     }));

//     const totalPages = take ? Math.ceil(totalCount / take) : 1;

//     res.status(200).json({
//       success: true,
//       message: "Restaurants fetched successfully",
//       data: formattedRestaurants,
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



export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    const {
      name,
      location,
      numberOfReview,
      rating,
      openTime,
      closeTime,
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
      ...(location && { location: { contains: String(location), mode: "insensitive" } }),
      ...(numberOfReview && { numberOfReview: String(numberOfReview) }),
      ...(rating && { rating: String(rating) }),
      ...(openTime && { openTime: String(openTime) }),
      ...(closeTime && { closeTime: String(closeTime) }),
      ...(bookingLink && { bookingLink: { contains: String(bookingLink), mode: "insensitive" } }),
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: "insensitive" } },
          { location: { contains: String(search), mode: "insensitive" } },
          { details: { contains: String(search), mode: "insensitive" } },
        ],
      }),
    };

    const [restaurants, totalCount] = await Promise.all([
      prisma.restaurant.findMany({
        where: filters,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.restaurant.count({ where: filters }),
    ]);

    let favoriteIdsSet = new Set<string>();

    if ((req as any).user) {
      const userId = (req as any).user.id;

      const userFavorites = await prisma.favorite.findMany({
        where: {
          userId,
          entityType: "RESTAURANT",
          entityId: { in: restaurants.map((r) => r.id) },
        },
        select: { entityId: true },
      });

      favoriteIdsSet = new Set(userFavorites.map((fav) => fav.entityId));
    }

    const formattedRestaurants = restaurants.map((restaurant) => ({
      ...restaurant,
      image: getImageUrl(restaurant.image),
      isFavorite: favoriteIdsSet.has(restaurant.id),
    }));

    const totalPages = take ? Math.ceil(totalCount / take) : 1;

    res.status(200).json({
      success: true,
      message: "Restaurants fetched successfully",
      data: formattedRestaurants,
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
