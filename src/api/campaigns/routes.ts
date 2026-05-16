import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../config/database.js';
import { Campaign } from '../../entities/Campaign.js';

const router = Router();
const campaignRepository = AppDataSource.getRepository(Campaign);

// List campaigns
router.get('/', async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignRepository.find();
    res.json(campaigns);
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get campaign by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepository.findOne({
      where: { id: req.params.id },
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

// Create campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const campaign = campaignRepository.create(req.body);
    await campaignRepository.save(campaign);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update campaign
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepository.findOne({
      where: { id: req.params.id },
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    campaignRepository.merge(campaign, req.body);
    await campaignRepository.save(campaign);
    res.json(campaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete campaign
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepository.findOne({
      where: { id: req.params.id },
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
