import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { AppDataSource } from '../../config/database.js';
import { User } from '../../entities/User.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and fullName required' });
    }

    const existing = await userRepository.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = userRepository.create({
      email,
      password: hashedPassword,
      fullName,
      apiKey: uuidv4(),
    });

    await userRepository.save(user);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user.id, email, fullName } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email, fullName: user.fullName } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
