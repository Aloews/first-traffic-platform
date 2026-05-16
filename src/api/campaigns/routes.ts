import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../config/database.js';
import { Campaign } from '../../entities/Campaign.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const campaignRepository = AppDataSource.getRepository(Campaign);

// Get all campaigns for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignRepository.find({
      where: { userId: req.user!.id },
      order: { createdAt: 'DESC' },
    });
    res.json(campaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single campaign
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepository.findOne({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, totalBudget, bidStrategy, targeting, trafficSources } = req.body;

    if (!name || !totalBudget) {
      return res.status(400).json({ error: 'name and totalBudget are required' });
    }

    const campaign = campaignRepository.create({
      name,
      description,
      totalBudget,
      bidStrategy,
      targeting: targeting || {},
      trafficSources: trafficSources || [],
      userId: req.user!.id,
    });

    await campaignRepository.save(campaign);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a campaign
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepository.findOne({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    Object.assign(campaign, req.body);
    await campaignRepository.save(campaign);
    res.json(campaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a campaign
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepository.findOne({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await campaignRepository.remove(campaign);
    res.status(204).send();
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
