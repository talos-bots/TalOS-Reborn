/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './database.js';
import { JWT_SECRET } from './main.js';
import { authenticateToken } from './authenticate-token.js';
dotenv.config();

export const usersRouter = express.Router();

usersRouter.post('/register', async (req, res) => {
    const { username, password, display_name } = req.body;
    if (!username || !password || !display_name) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    // Check if username already exists
    const checkUserQuery = `SELECT username FROM users WHERE username = ?`;
    db.get(checkUserQuery, [username], async (checkErr: any, row: any) => {
        if (checkErr) {
            res.status(500).json({ error: checkErr.message });
            return;
        }
        if (row) {
            res.status(409).json({ error: 'Username already taken' });
            return;
        }

        // Proceed with registration
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = `INSERT INTO users (username, hashed_password, display_name ) VALUES (?, ?, ?)`;

        db.run(insertQuery, [username, hashedPassword, display_name], function(err: any) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'User registered successfully', id: this.lastID });
        });
    });
});

usersRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }
    const query = `SELECT * FROM users WHERE username = ?`;

    db.get(query, [username], async (err: any, user: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (user && await bcrypt.compare(password, user.hashed_password)) {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET ?? '', { expiresIn: '24h' });

            // Set cookie with the token
            res.cookie('talosAuthToken', token, {
                httpOnly: false, // Makes the cookie inaccessible to client-side JavaScript
                secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            res.json({ message: 'Login successful' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

usersRouter.post('/logout', (req, res) => {
    res.cookie('talosAuthToken', '', { expires: new Date(0) });
    res.json({ message: 'Logged out successfully' });
});

usersRouter.get('/me', authenticateToken, (req, res) => {
    const query = `SELECT id, username, profile_pic, display_name, bio, background_pic, tagline FROM users WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.get(query, [req.user.userId], (err: any, user: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(user);
    });
});

// check if a user is logged in
usersRouter.get('/isLoggedIn', authenticateToken, (req, res) => {
    res.json({ message: 'Logged in' });
});

// allow a user to change their password
usersRouter.post('/changePassword', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const query = `SELECT * FROM users WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.get(query, [req.user.userId], async (err: any, user: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (user && await bcrypt.compare(oldPassword, user.hashed_password)) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updateQuery = `UPDATE users SET hashed_password = ? WHERE id = ?`;
            //@ts-expect-error - user is a property of the Request interface
            db.run(updateQuery, [hashedPassword, req.user.userId], function(err: any) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Password changed successfully' });
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

// allow a user to change their profile picture
usersRouter.post('/changeProfilePicture', authenticateToken, async (req, res) => {
    const { profilePicture } = req.body;
    if (!profilePicture) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET profile_pic = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [profilePicture, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Profile picture changed successfully' });
    });
});

// allow a user to change their display name
usersRouter.post('/changeDisplayName', authenticateToken, async (req, res) => {
    const { displayName } = req.body;
    if (!displayName) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET display_name = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [displayName, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Display name changed successfully' });
    });
});

// allow a user to change their display name
usersRouter.post('/changeProfileBackground', authenticateToken, async (req, res) => {
    const { backgroundPic } = req.body;
    if (!backgroundPic) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET background_pic = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [backgroundPic, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Display name changed successfully' });
    });
});

// allow a user to change their tagline
usersRouter.post('/changeTagline', authenticateToken, async (req, res) => {
    const { tagline } = req.body;
    if (!tagline) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET tagline = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [tagline, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Display name changed successfully' });
    });
});

// allow a user to change their tagline
usersRouter.post('/changeBio', authenticateToken, async (req, res) => {
    const { bio } = req.body;
    if (!bio) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }

    const updateQuery = `UPDATE users SET bio = ? WHERE id = ?`;
    //@ts-expect-error - user is a property of the Request interface
    db.run(updateQuery, [bio, req.user.userId], function(err: any) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Display name changed successfully' });
    });
});

// allow unauthenticated users to view a user's profile
usersRouter.get('/profile/:id', (req, res) => {
    const id = req.params.id;
    const query = `SELECT id, username, profile_pic, display_name, bio, background_pic, tagline FROM users WHERE id = ?`;

    db.get(query, [id], (err: any, user: any) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(user);
    });
});

export function getAllUsers(){
    try{
        const query = `SELECT id, username, profile_pic, display_name, bio, background_pic, tagline FROM users`;

        db.all(query, [], (err: any, users: any) => {
            if(err){
                throw new Error(`Error: ${err.message}`);
            }
            return JSON.parse(JSON.stringify(users));
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return null;
    }
}
// get all users
usersRouter.get('/profiles', (req, res) => {
    const users = getAllUsers();
    if(users){
        res.json(users);
    } else {
        res.status(400).json({ error: 'Error fetching users' });
    }
});