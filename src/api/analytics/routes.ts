import { Router, Request, Response } from 'express';
import { AppDataSource } from '@/config/database';
import { Campaign } from '@/entities/Campaign';
import { CampaignAnalytics } from '@/entities/CampaignAnalytics';
import { authMiddleware } from '@/middleware/auth';

const router = Router();
router.use(authMiddleware);

const campaignRepository = AppDataSource.getRepository(Campaign);
const analyticsRepository = AppDataSource.getRepository(CampaignAnalytics);

// Get dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const campaigns = await campaignRepository.find({
      where: { userId: req.user!.id },
    });

    const campaignIds = campaigns.map((c) => c.id);

    // Get today's analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAnalytics = await analyticsRepository.find({
      where: {
        campaignId: campaigns.length > 0 ? campaignIds[0] : '', // Get first campaign
        date: today,
      },
    });

    const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent), 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.totalBudget), 0);
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

    const aggregatedMetrics = todayAnalytics.reduce(
      (acc, a) => ({
        impressions: acc.impressions + a.impressions,
        clicks: acc.clicks + a.clicks,
        conversions: acc.conversions + a.conversions,
        spent: acc.spent + Number(a.spent),
        revenue: acc.revenue + Number(a.revenue),
      }),
      { impressions: 0, clicks: 0, conversions: 0, spent: 0, revenue: 0 }
    );

    res.json({
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalSpent,
      totalBudget,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      today: aggregatedMetrics,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics for date range
router.get('/analytics/range', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, campaignId } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let query = analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.date BETWEEN :start AND :end', { start, end });

    if (campaignId) {
      query = query.andWhere('analytics.campaignId = :campaignId', { campaignId });
    }

    const analytics = await query.orderBy('analytics.date', 'ASC').getMany();

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics range error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
