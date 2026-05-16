import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../config/database.js';
import { Campaign } from '../../entities/Campaign.js';

const router = Router();
const campaignRepository = AppDataSource.getRepository(Campaign);

// RTB bid request endpoint
router.post('/bid', async (req: Request, res: Response) => {
  try {
    const { campaignId, floorPrice, impressionId } = req.body;

    if (!campaignId || floorPrice === undefined || !impressionId) {
      return res.status(400).json({ error: 'campaignId, floorPrice, and impressionId are required' });
    }

    const campaign = await campaignRepository.findOne({
      where: { id: campaignId, status: 'active' },
    });

    if (!campaign) {
      return res.status(204).send(); // No bid — campaign not found or inactive
    }

    const remainingBudget = Number(campaign.totalBudget) - Number(campaign.spent);
    if (remainingBudget <= 0 || remainingBudget < Number(floorPrice)) {
      return res.status(204).send(); // No bid — insufficient budget
    }

    // Simple bid response at floor price
    res.json({
      id: impressionId,
      bidPrice: Number(floorPrice),
      campaignId: campaign.id,
    });
  } catch (error) {
    console.error('RTB bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RTB win notification
router.post('/win', async (req: Request, res: Response) => {
  try {
    const { campaignId, clearPrice } = req.body;

    if (!campaignId || clearPrice === undefined) {
      return res.status(400).json({ error: 'campaignId and clearPrice are required' });
    }

    const campaign = await campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaign.spent = Number(campaign.spent) + Number(clearPrice);
    await campaignRepository.save(campaign);

    res.json({ success: true });
  } catch (error) {
    console.error('RTB win notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
