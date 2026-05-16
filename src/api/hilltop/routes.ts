import { Router, Request, Response } from 'express';

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../config/database.js';
import { Campaign } from '../../entities/Campaign.js';
import { CampaignAnalytics } from '../../entities/CampaignAnalytics.js';
import { authMiddleware } from '../../middleware/auth.js';
import {
  createHilltopCampaign,
  getHilltopCampaign,
  listHilltopCampaigns,
  updateHilltopBid,
  pauseHilltopCampaign,
  activateHilltopCampaign,
  getHilltopStats,
} from '../../services/hilltop.js';
import { optimizeCampaigns, analyzeZones } from '../../services/optimizer.js';

const router = Router();
router.use(authMiddleware);

const campaignRepo = () => AppDataSource.getRepository(Campaign);
const analyticsRepo = () => AppDataSource.getRepository(CampaignAnalytics);

// ─── Sync campaign to HilltopAds ─────────────────────────────────────────────

/**
 * POST /api/hilltop/sync/:campaignId
 * Creates or syncs a local campaign to HilltopAds
 */
router.post('/sync/:campaignId', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepo().findOne({
      where: { id: req.params.campaignId, userId: req.user!.id },
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const { url, rate, geo, browser, device, os, dailyBudget } = req.body;

    if (!url || !rate) {
      return res.status(400).json({ error: 'url and rate are required' });
    }

    // Already synced? Just update bid
    if (campaign.targeting?.hilltopId) {
      await updateHilltopBid(campaign.targeting.hilltopId, rate);
      campaign.targeting = { ...campaign.targeting, hilltopRate: rate };
      await campaignRepo().save(campaign);
      return res.json({ message: 'Bid updated', hilltopId: campaign.targeting.hilltopId });
    }

    // Create new on HilltopAds
    const hilltopCampaign = await createHilltopCampaign({
      name: `${campaign.name} [${campaign.id.slice(0, 8)}]`,
      url,
      rate,
      totalBudget: Number(campaign.totalBudget),
      dailyBudget: dailyBudget || Math.min(Number(campaign.totalBudget) / 10, 50),
      geo: geo || [],
      browser: browser || [],
      device: device || [],
      os: os || [],
      active: false, // starts paused, user launches manually
    });

    // Save hilltop reference in campaign targeting field
    campaign.targeting = {
      ...campaign.targeting,
      hilltopId: hilltopCampaign.id,
      hilltopRate: rate,
      url,
      geo,
      browser,
      device,
    };
    await campaignRepo().save(campaign);

    res.status(201).json({
      message: 'Campaign synced to HilltopAds',
      hilltopId: hilltopCampaign.id,
      campaign: hilltopCampaign,
    });
  } catch (err: any) {
    console.error('Hilltop sync error:', err?.response?.data || err.message);
    res.status(500).json({ error: err?.response?.data?.message || 'Failed to sync campaign' });
  }
});

// ─── Get HilltopAds campaign status ──────────────────────────────────────────

/**
 * GET /api/hilltop/status/:campaignId
 * Returns live status from HilltopAds for a campaign
 */
router.get('/status/:campaignId', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepo().findOne({
      where: { id: req.params.campaignId, userId: req.user!.id },
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const hilltopId = campaign.targeting?.hilltopId;
    if (!hilltopId) {
      return res.status(400).json({ error: 'Campaign not synced to HilltopAds yet' });
    }

    const hilltopData = await getHilltopCampaign(hilltopId);
    res.json(hilltopData);
  } catch (err: any) {
    res.status(500).json({ error: err?.response?.data?.message || 'Failed to get status' });
  }
});

// ─── Pull stats from HilltopAds into our DB ──────────────────────────────────

/**
 * POST /api/hilltop/pull-stats/:campaignId
 * Pulls today's stats from HilltopAds and saves to analytics DB
 */
router.post('/pull-stats/:campaignId', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepo().findOne({
      where: { id: req.params.campaignId, userId: req.user!.id },
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const hilltopId = campaign.targeting?.hilltopId;
    if (!hilltopId) return res.status(400).json({ error: 'Not synced to HilltopAds' });

    const today = new Date().toISOString().split('T')[0];
    const stats = await getHilltopStats(hilltopId, today, today);

    // Upsert analytics record
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let record = await analyticsRepo().findOne({
      where: { campaignId: campaign.id, date: todayDate },
    });

    if (!record) {
      record = analyticsRepo().create({
        campaignId: campaign.id,
        date: todayDate,
      });
    }

    record.impressions = stats.impressions;
    record.clicks = stats.clicks;
    record.spent = stats.spent;
    // Revenue needs to come from your postback tracking
    // For now we estimate based on CPC model
    record.revenue = stats.clicks * (campaign.targeting?.revenuePerClick || 0);

    await analyticsRepo().save(record);

    // Update campaign spent total
    await campaignRepo().update(campaign.id, { spent: stats.spent } as any);

    res.json({ message: 'Stats pulled', stats });
  } catch (err: any) {
    res.status(500).json({ error: err?.response?.data?.message || 'Failed to pull stats' });
  }
});

// ─── Update bid ───────────────────────────────────────────────────────────────

/**
 * PATCH /api/hilltop/bid/:campaignId
 * Manually update bid for a campaign
 */
router.patch('/bid/:campaignId', async (req: Request, res: Response) => {
  try {
    const { rate } = req.body;
    if (!rate || rate < 0.1) return res.status(400).json({ error: 'rate must be >= 0.1' });

    const campaign = await campaignRepo().findOne({
      where: { id: req.params.campaignId, userId: req.user!.id },
    });

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const hilltopId = campaign.targeting?.hilltopId;
    if (!hilltopId) return res.status(400).json({ error: 'Not synced to HilltopAds' });

    await updateHilltopBid(hilltopId, rate);
    campaign.targeting = { ...campaign.targeting, hilltopRate: rate };
    await campaignRepo().save(campaign);

    res.json({ message: 'Bid updated', rate });
  } catch (err: any) {
    res.status(500).json({ error: err?.response?.data?.message || 'Failed to update bid' });
  }
});

// ─── Pause / Activate ─────────────────────────────────────────────────────────

router.post('/pause/:campaignId', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepo().findOne({
      where: { id: req.params.campaignId, userId: req.user!.id },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const hilltopId = campaign.targeting?.hilltopId;
    if (!hilltopId) return res.status(400).json({ error: 'Not synced to HilltopAds' });

    await pauseHilltopCampaign(hilltopId);
    await campaignRepo().update(campaign.id, { status: 'paused' } as any);

    res.json({ message: 'Campaign paused on HilltopAds' });
  } catch (err: any) {
    res.status(500).json({ error: err?.response?.data?.message || 'Failed to pause' });
  }
});

router.post('/activate/:campaignId', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepo().findOne({
      where: { id: req.params.campaignId, userId: req.user!.id },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const hilltopId = campaign.targeting?.hilltopId;
    if (!hilltopId) return res.status(400).json({ error: 'Not synced to HilltopAds' });

    await activateHilltopCampaign(hilltopId);
    await campaignRepo().update(campaign.id, { status: 'active' } as any);

    res.json({ message: 'Campaign activated on HilltopAds' });
  } catch (err: any) {
    res.status(500).json({ error: err?.response?.data?.message || 'Failed to activate' });
  }
});

// ─── Run optimizer manually ───────────────────────────────────────────────────

/**
 * POST /api/hilltop/optimize
 * Run optimization cycle for all active campaigns
 */
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const results = await optimizeCampaigns();
    res.json({ message: 'Optimization complete', results });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Optimization failed' });
  }
});

// ─── Zone analysis ────────────────────────────────────────────────────────────

/**
 * GET /api/hilltop/zones/:campaignId
 * Analyze which zones perform well and which to blacklist
 */
router.get('/zones/:campaignId', async (req: Request, res: Response) => {
  try {
    const campaign = await campaignRepo().findOne({
      where: { id: req.params.campaignId, userId: req.user!.id },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const hilltopId = campaign.targeting?.hilltopId;
    if (!hilltopId) return res.status(400).json({ error: 'Not synced to HilltopAds' });

    const zones = await analyzeZones(campaign.id, hilltopId);
    res.json(zones);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze zones' });
  }
});

// ─── List all HilltopAds campaigns ───────────────────────────────────────────

/**
 * GET /api/hilltop/campaigns
 * Get all campaigns from HilltopAds account
 */
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = await listHilltopCampaigns();
    res.json(campaigns);
  } catch (err: any) {
    res.status(500).json({ error: err?.response?.data?.message || 'Failed to list campaigns' });
  }
});

// ─── Conversion postback (called by your offer/landing page) ─────────────────

/**
 * GET /api/hilltop/postback
 * Track a conversion - call this from your offer
 * Example: https://your-domain.com/api/hilltop/postback?click_id={click_id}&revenue=0.5
 */
router.get('/postback', async (req: Request, res: Response) => {
  try {
    const { click_id, revenue, campaign_id } = req.query;

    if (!click_id) return res.status(400).json({ error: 'click_id required' });

    const rev = parseFloat(String(revenue || '0'));

    // Find today's analytics record if campaign_id provided
    if (campaign_id) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const record = await analyticsRepo().findOne({
        where: { campaignId: String(campaign_id), date: today },
      });

      if (record) {
        record.conversions = (record.conversions || 0) + 1;
        record.revenue = Number(record.revenue) + rev;
        await analyticsRepo().save(record);
      }
    }

    console.log(`✅ Conversion tracked: click_id=${click_id}, revenue=$${rev}`);
    res.send('OK');
  } catch (err) {
    console.error('Postback error:', err);
    res.send('OK'); // Always return OK to the offer
  }
});

export default router;
Done
