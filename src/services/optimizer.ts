import { AppDataSource } from '../config/database.js';
import { Campaign } from '../entities/Campaign.js';
import { CampaignAnalytics } from '../entities/CampaignAnalytics.js';
import {
  getHilltopStats,
  updateHilltopBid,
  pauseHilltopCampaign,
  getHilltopStatsByZone,
} from './hilltop.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const OPTIMIZER_CONFIG = {
  // Pause campaign if CTR drops below this threshold
  minCTR: 0.05,           // 0.05%
  // Increase bid if CTR is above this (good performance)
  goodCTR: 0.3,           // 0.3%
  // Max bid increase per optimization cycle (%)
  maxBidIncrease: 0.15,   // +15%
  // Max bid decrease per optimization cycle (%)
  maxBidDecrease: 0.20,   // -20%
  // Minimum bid in USD
  minBid: 0.1,
  // Maximum bid in USD
  maxBid: 10.0,
  // Min impressions before making optimization decisions
  minImpressions: 5000,
  // ROI threshold to consider campaign profitable
  minROI: 0,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface OptimizationResult {
  campaignId: string;
  action: 'increase_bid' | 'decrease_bid' | 'pause' | 'no_action';
  oldBid?: number;
  newBid?: number;
  reason: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    spent: number;
    revenue: number;
    roi: number;
  };
}

// ─── Main Optimizer ───────────────────────────────────────────────────────────

export async function optimizeCampaigns(): Promise<OptimizationResult[]> {
  const campaignRepo = AppDataSource.getRepository(Campaign);
  const analyticsRepo = AppDataSource.getRepository(CampaignAnalytics);

  const activeCampaigns = await campaignRepo.find({
    where: { status: 'active' },
  });

  const results: OptimizationResult[] = [];

  for (const campaign of activeCampaigns) {
    try {
      const result = await optimizeSingleCampaign(campaign, analyticsRepo);
      results.push(result);
    } catch (err) {
      console.error(`Optimizer error for campaign ${campaign.id}:`, err);
    }
  }

  console.log(`✅ Optimization cycle complete. Processed ${results.length} campaigns.`);
  return results;
}

async function optimizeSingleCampaign(
  campaign: Campaign,
  analyticsRepo: any
): Promise<OptimizationResult> {
  // Get today's analytics from our DB
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAnalytics = await analyticsRepo.findOne({
    where: { campaignId: campaign.id, date: today },
  });

  const impressions = todayAnalytics?.impressions || 0;
  const clicks = todayAnalytics?.clicks || 0;
  const spent = Number(todayAnalytics?.spent || 0);
  const revenue = Number(todayAnalytics?.revenue || 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;

  const metrics = { impressions, clicks, ctr, spent, revenue, roi };

  // Get current bid from campaign targeting
  const currentBid = campaign.targeting?.hilltopRate || 1.0;
  const hilltopId = campaign.targeting?.hilltopId;

  // Not enough data yet
  if (impressions < OPTIMIZER_CONFIG.minImpressions) {
    return {
      campaignId: campaign.id,
      action: 'no_action',
      reason: `Not enough data: ${impressions}/${OPTIMIZER_CONFIG.minImpressions} impressions`,
      metrics,
    };
  }

  // Budget nearly exhausted — pause
  const budgetUsedPct = spent / Number(campaign.totalBudget);
  if (budgetUsedPct > 0.95) {
    if (hilltopId) await pauseHilltopCampaign(hilltopId);
    await updateCampaignStatus(campaign.id, 'paused');
    return {
      campaignId: campaign.id,
      action: 'pause',
      reason: `Budget ${(budgetUsedPct * 100).toFixed(1)}% exhausted`,
      metrics,
    };
  }

  // CTR too low — decrease bid or pause
  if (ctr < OPTIMIZER_CONFIG.minCTR) {
    const newBid = Math.max(
      OPTIMIZER_CONFIG.minBid,
      currentBid * (1 - OPTIMIZER_CONFIG.maxBidDecrease)
    );

    if (hilltopId) await updateHilltopBid(hilltopId, newBid);
    await updateCampaignBid(campaign.id, newBid);

    return {
      campaignId: campaign.id,
      action: 'decrease_bid',
      oldBid: currentBid,
      newBid,
      reason: `CTR too low: ${ctr.toFixed(3)}% < ${OPTIMIZER_CONFIG.minCTR}%`,
      metrics,
    };
  }

  // ROI negative — decrease bid
  if (roi < OPTIMIZER_CONFIG.minROI && spent > 5) {
    const newBid = Math.max(
      OPTIMIZER_CONFIG.minBid,
      currentBid * (1 - OPTIMIZER_CONFIG.maxBidDecrease * 0.5)
    );

    if (hilltopId) await updateHilltopBid(hilltopId, newBid);
    await updateCampaignBid(campaign.id, newBid);

    return {
      campaignId: campaign.id,
      action: 'decrease_bid',
      oldBid: currentBid,
      newBid,
      reason: `Negative ROI: ${roi.toFixed(1)}%`,
      metrics,
    };
  }

  // Good CTR and positive ROI — increase bid to get more traffic
  if (ctr >= OPTIMIZER_CONFIG.goodCTR && roi > 10) {
    const newBid = Math.min(
      OPTIMIZER_CONFIG.maxBid,
      currentBid * (1 + OPTIMIZER_CONFIG.maxBidIncrease)
    );

    if (hilltopId) await updateHilltopBid(hilltopId, newBid);
    await updateCampaignBid(campaign.id, newBid);

    return {
      campaignId: campaign.id,
      action: 'increase_bid',
      oldBid: currentBid,
      newBid,
      reason: `Good performance: CTR ${ctr.toFixed(2)}%, ROI ${roi.toFixed(1)}%`,
      metrics,
    };
  }

  return {
    campaignId: campaign.id,
    action: 'no_action',
    reason: `Stable: CTR ${ctr.toFixed(2)}%, ROI ${roi.toFixed(1)}%`,
    metrics,
  };
}

// ─── Zone Blacklisting ────────────────────────────────────────────────────────

export async function analyzeZones(campaignId: string, hilltopId: number): Promise<{
  badZones: string[];
  goodZones: string[];
}> {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const zones = await getHilltopStatsByZone(hilltopId, weekAgo, today);

  const badZones: string[] = [];
  const goodZones: string[] = [];

  for (const zone of zones) {
    const ctr = zone.impressions > 0 ? (zone.clicks / zone.impressions) * 100 : 0;
    const spent = zone.cost || 0;

    if (zone.impressions > 10000 && ctr < 0.02 && spent > 1) {
      badZones.push(zone.zoneId);
    } else if (ctr > 0.5) {
      goodZones.push(zone.zoneId);
    }
  }

  return { badZones, goodZones };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updateCampaignBid(campaignId: string, newBid: number): Promise<void> {
  const repo = AppDataSource.getRepository(Campaign);
  const campaign = await repo.findOne({ where: { id: campaignId } });
  if (!campaign) return;

  campaign.targeting = {
    ...campaign.targeting,
    hilltopRate: newBid,
  };
  await repo.save(campaign);
}

async function updateCampaignStatus(campaignId: string, status: string): Promise<void> {
  const repo = AppDataSource.getRepository(Campaign);
  await repo.update(campaignId, { status } as any);
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export function startOptimizationScheduler(intervalMinutes = 60): void {
  console.log(`🤖 Optimizer scheduler started (every ${intervalMinutes} min)`);

  setInterval(async () => {
    console.log('🔄 Running optimization cycle...');
    try {
      const results = await optimizeCampaigns();
      const actions = results.filter(r => r.action !== 'no_action');
      if (actions.length > 0) {
        console.log(`⚡ Optimizer took ${actions.length} actions:`);
        actions.forEach(a => console.log(`  - ${a.campaignId}: ${a.action} — ${a.reason}`));
      }
    } catch (err) {
      console.error('Optimizer error:', err);
    }
  }, intervalMinutes * 60 * 1000);
}
