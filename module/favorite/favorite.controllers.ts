import { Request, Response } from "express";
import { PrismaClient, EntityType } from "@prisma/client";
import { getImageUrl } from "../../utils/base_utl";

const prisma = new PrismaClient();

export const addToFavorites = async (req: Request, res: Response) => {
  try {
    const { entityId, entityType } = req.body;
    const userId = req.user.id; // From auth middleware

    const requiredFields = ["entityId", "entityType"];
    const missing = requiredFields.find((field) => !req.body[field]);

    if (missing) {
      res.status(400).json({
        success: false,
        message: `${missing} is required!`,
      });
      return;
    }

    // Validate entityType
    if (!Object.values(EntityType).includes(entityType)) {
      res.status(400).json({
        success: false,
        message: "Invalid entity type",
      });
      return;
    }

    // Check if entity exists based on type
    const entity = await getEntityById(entityId, entityType);
    if (!entity) {
      res.status(404).json({
        success: false,
        message: "Entity not found",
      });
      return;
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        entityId,
        entityType,
      },
    });

    res.status(201).json({
      success: true,
      message: "Added to favorites successfully",
      data: favorite,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: "Item already in favorites",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    const { entityId, entityType } = req.params;
    const userId = req.user.id; // From auth middleware

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        entityId,
        entityType: entityType as EntityType,
      },
    });

    if (!favorite) {
      res.status(404).json({
        success: false,
        message: "Favorite not found",
      });
      return;
    }

    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Removed from favorites successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const entityTypes = ["HOTEL", "RESTAURANT", "VISIT_AREA", "DISH"] as const;

    const results = await Promise.all(
      entityTypes.map(async (type) => {
        const favorites = await prisma.favorite.findMany({
          where: { userId, entityType: type },
          select: { entityId: true },
        });

        const ids = favorites.map(f => f.entityId);

        if (ids.length === 0) return { type, items: [] };

        let entities: any[] = [];

        switch (type) {
          case "HOTEL":
            entities = await prisma.hotel.findMany({
              where: { id: { in: ids } },
              select: {
                id: true,
                name: true,
                location: true,
                numberOfReview: true,
                rating: true,
                bookingLink: true,
                image: true,
                pool: true,
                restaurant: true,
                freeWifi: true,
                spa: true,
                createdAt: true,
              },
            });
            break;

          case "RESTAURANT":
            entities = await prisma.restaurant.findMany({
              where: { id: { in: ids } },
              select: {
                id: true,
                name: true,
                location: true,
                numberOfReview: true,
                rating: true,
                image: true,
                openTime: true,
                closeTime: true,
                details: true,
                bookingLink: true,
                createdAt: true,
              },
            });
            break;

          case "VISIT_AREA":
            entities = await prisma.visitArea.findMany({
              where: { id: { in: ids } },
              select: {
                id: true,
                name: true,
                location: true,
                description: true,
                image: true,
                detailsLink: true,
                createdAt: true,
              },
            });
            break;

          case "DISH":
            entities = await prisma.traditionalDish.findMany({
              where: { id: { in: ids } },
              select: {
                id: true,
                name: true,
                price: true,
                numberOfReview: true,
                rating: true,
                image: true,
                bookingLink: true,
                createdAt: true,
              },
            });
            break;
        }

        return {
          type,
          items: entities.map(e => ({
            ...e,
            image: e.image ? getImageUrl(e.image) : null,
          })),
        };
      })
    );

    // Combine results into a structured object
    const finalData = results.reduce((acc, curr) => {
      acc[curr.type.toLowerCase()] = curr.items;
      return acc;
    }, {} as Record<string, any[]>);

    res.status(200).json({
      success: true,
      message: "Favorites grouped by entity type",
      data: finalData,
    });
  } catch (error) {
    console.error("getUserFavorites error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};




async function getEntityById(id: string, entityType: EntityType) {
  switch (entityType) {
    case "HOTEL":
      return prisma.hotel.findUnique({ where: { id } });
    case "RESTAURANT":
      return prisma.restaurant.findUnique({ where: { id } });
    case "VISIT_AREA":
      return prisma.visitArea.findUnique({ where: { id } });
    case "DISH":
      return prisma.traditionalDish.findUnique({ where: { id } });
    default:
      return null;
  }
}