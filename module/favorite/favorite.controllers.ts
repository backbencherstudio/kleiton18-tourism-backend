import { Request, Response } from "express";
import { PrismaClient, EntityType } from "@prisma/client";

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
    const { entityType } = req.query;

    const filters: any = {
      userId,
      ...(entityType && { entityType: entityType as EntityType }),
    };

    const favorites = await prisma.favorite.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Fetch detailed information for each favorite
    const detailedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        const entityDetails = await getEntityById(
          favorite.entityId,
          favorite.entityType
        );
        return {
          ...favorite,
          entityDetails,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Favorites fetched successfully",
      data: detailedFavorites,
    });
  } catch (error) {
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
    default:
      return null;
  }
}