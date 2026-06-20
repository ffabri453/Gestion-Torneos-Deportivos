import { Request, Response } from 'express';

export const getTournaments = (req: Request, res: Response) => {
  res.status(200).json({
    message: 'List of tournaments',
    data: []
  });
};