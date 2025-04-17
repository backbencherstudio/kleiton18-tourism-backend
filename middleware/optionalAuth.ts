import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: any;
}

const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (authHeader) {
      const decoded = jwt.verify(authHeader, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true }
      });
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};

export default optionalAuth;