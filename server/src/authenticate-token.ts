import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['talosAuthToken'];
    if (token == null) return res.status(401).send('Access denied');

    // @ts-expect-error - user is a property of the verify function
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Invalid token');
        // @ts-expect-error - user is a property of the verify function
        req.user = user;
        next();
    });
};
