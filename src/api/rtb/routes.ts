import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../config/database.js';
import { RTBAuction } from '../../entities/RTBAuction.js';
import { Campaign } from '../../entities/Campaign.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const auctionRepository = AppDataSource.getRepository(RTBAuction);
const campaignRepository = AppDataSource.getRepository(Campaign);

// Get all auctions for the authenticated user's campaigns
router.get('/auctions', async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignRepository.find({
      where: { userId: req.user!.id },
    });
    const campaignIds = campaigns.map((c) => c.id);

    if (campaignIds.length === 0) {
      return res.json([]);
    }

    const auctions = await auctionRepository
      .createQueryBuilder('auction')
      .where('auction.campaignId IN (:...campaignIds)', { campaignIds })
      .orderBy('auction.createdAt', 'DESC')
      .limit(100)
      .getMany();

    res.json(auctions);
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle incoming bid request (OpenRTB)
router.post('/bid', async (req: Request, res: Response) => {
  try {
    const bidRequest = req.body;

    // Find active campaigns to bid with
    const campaigns = await campaignRepository.find({
      where: { status: 'active', userId: req.user!.id },
    });

    if (campaigns.length === 0) {
      return res.status(204).send();
    }

    // Simple bid logic: use the first active campaign
    const campaign = campaigns[0];
    const bidPrice = 0.5; // Default bid price

    const auction = auctionRepository.create({
      campaignId: campaign.id,
      bidPrice,
      won: false,
      bidRequest,
      bidResponse: { price: bidPrice },
    });

    await auctionRepository.save(auction);

    res.json({
      id: bidRequest.id,
      seatbid: [
        {
          bid: [
            {
              id: auction.id,
              impid: bidRequest.imp?.[0]?.id || '1',
              price: bidPrice,
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
