import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import fs from "fs";
import { appSettingsPath } from '../server.js';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies['talosAuthToken'];
    if (token == null) return res.status(401).send('Access denied');
    const settingsData = fs.readFileSync(appSettingsPath, 'utf8')
    const settings = JSON.parse(settingsData);
    const JWT_SECRET = settings.jwtSecret;
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).send('Invalid token');
      // @ts-expect-error - user is a property of the verify function
      req.user = user;
      next();
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal server error');
  }
};
