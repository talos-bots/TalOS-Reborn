import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_SECRET } from '../server.js';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['talosAuthToken'];
    if (token == null) return res.status(401).send('Access denied');

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).send('Invalid token');
        // @ts-expect-error - user is a property of the verify function
        req.user = user;
        next();
    });
};
