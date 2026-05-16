import axios from 'axios';
import { AppDataSource } from '../config/database.js';
import { UserIntegration } from '../entities/UserIntegration.js';

const HILLTOP_API = 'https://api.hilltopads.com/v1';

// ─── Get API key for user ─────────────────────────────────────────────────────

export async function getHilltopKey(userId: string): Promise<string> {
  const repo = AppDataSource.getRepository(UserIntegration);
  const integration = await repo.findOne({
    where: { userId, provider: 'hilltopads', isActive: true },
  });

  if (!integration?.apiKey) {
    throw new Error('HilltopAds API key not configured. Please add it in Settings → Integrations.');
  }

  return integration.apiKey;
}

function api(apiKey: string) {
  return axios.create({
    baseURL: HILLTOP_API,
    timeout: 10000,
    params: { key: apiKey },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdFormat =
  | 'Banner'
  | 'Popunder mobile'
  | 'Popunder desktop'
  | 'In-Page Push'
  | 'Video Slider'
  | 'Interstitial';

export interface HilltopCampaignCreate {
  name: string;
  url: string;
  format: AdFormat;
  rate: number;
  totalBudget?: number;
  dailyBudget?: number;
  geo?: string[];
  browser?: string[];
  device?: string[];
  os?: string[];
  active?: boolean;
  // Banner specific
  bannerSizes?: string[];
  // Push specific
  pushTitle?: string;
  pushText?: string;
  pushIconUrl?: string;
  pushImageUrl?: string;
  // Frequency cap
  capTotal?: number;
  capResetAfter?: number;
}

export interface HilltopCampaign {
  id: number;
  name: string;
  status: string;
  rate: number;
  impressions: number;
  clicks: number;
  spent: number;
  ctr: number;
  cpc: number;
}

export interface HilltopStats {
  impressions: number;
  clicks: number;
  spent: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function getChannelsForFormat(format: AdFormat): string[] {
  switch (format) {
    case 'Popunder mobile':
    case 'Popunder desktop':
      return ['Mainstream High Activity', 'Mainstream Medium Activity'];
    case 'In-Page Push':
      return ['Mainstream High Activity', 'Mainstream Medium Activity', 'Mainstream Low Activity'];
    default:
      return ['Mainstream High Activity', 'Mainstream Medium Activity'];
  }
}

// ─── Campaign Management ──────────────────────────────────────────────────────

export async function createHilltopCampaign(
  userId: string,
  data: HilltopCampaignCreate
): Promise<HilltopCampaign> {
  const apiKey = await getHilltopKey(userId);
  const http = api(apiKey);

  const targeting: Record<string, any> = {};
  if (data.geo?.length) targeting.geo = { operator: 'in', operand: data.geo };
  if (data.browser?.length) targeting.browser = { operator: 'in', operand: data.browser };
  if (data.device?.length) targeting.device = { operator: 'in', operand: data.device };
  if (data.os?.length) targeting.os = { operator: 'in', operand: data.os };

  const payload: Record<string, any> = {
    format: data.format,
    channels: getChannelsForFormat(data.format),
    type: 'CPM',
    rate: data.rate,
    name: data.name,
    url: encodeURIComponent(data.url),
    active: data.active ?? false,
    capTotal: data.capTotal ?? 3,
    capResetAfter: data.capResetAfter ?? 24,
    capForCampaign: 'campaign',
    filters: { Proxy: 'Disallow' },
  };

  if (data.totalBudget) payload.limitBudgetTotal = String(data.totalBudget);
  if (data.dailyBudget) payload.limitBudgetDaily = String(Math.max(20, data.dailyBudget));
  if (Object.keys(targeting).length) payload.targeting = targeting;

  // Push-specific creative
  if (data.format === 'In-Page Push') {
    payload.creative = {
      title: data.pushTitle || data.name,
      text: data.pushText || '',
      iconUrl: data.pushIconUrl || '',
      imageUrl: data.pushImageUrl || '',
    };
  }

  const res = await http.post('/advertiser/campaign', payload);
  return res.data;
}

export async function getHilltopCampaign(userId: string, hilltopId: number): Promise<HilltopCampaign> {
  const apiKey = await getHilltopKey(userId);
  const res = await api(apiKey).get(`/advertiser/campaign/${hilltopId}`);
  return res.data;
}

export async function listHilltopCampaigns(userId: string): Promise<HilltopCampaign[]> {
  const apiKey = await getHilltopKey(userId);
  const res = await api(apiKey).get('/advertiser/campaigns');
  return res.data?.campaigns || [];
}

export async function updateHilltopBid(userId: string, hilltopId: number, rate: number): Promise<void> {
  const apiKey = await getHilltopKey(userId);
  await api(apiKey).patch(`/advertiser/campaign/${hilltopId}`, { rate });
}

export async function pauseHilltopCampaign(userId: string, hilltopId: number): Promise<void> {
  const apiKey = await getHilltopKey(userId);
  await api(apiKey).post(`/advertiser/campaign/${hilltopId}/stop`);
}

export async function activateHilltopCampaign(userId: string, hilltopId: number): Promise<void> {
  const apiKey = await getHilltopKey(userId);
  await api(apiKey).post(`/advertiser/campaign/${hilltopId}/activate`);
}

export async function getHilltopStats(
  userId: string,
  hilltopId: number,
  dateFrom: string,
  dateTo: string
): Promise<HilltopStats> {
  const apiKey = await getHilltopKey(userId);
  const res = await api(apiKey).get(`/advertiser/campaign/${hilltopId}/stats`, {
    params: { dateFrom, dateTo },
  });

  const d = res.data;
  return {
    impressions: d.impressions || 0,
    clicks: d.clicks || 0,
    spent: d.cost || 0,
    ctr: d.ctr || 0,
    cpc: d.cpc || 0,
    cpm: d.cpm || 0,
  };
}

export async function getHilltopStatsByZone(
  userId: string,
  hilltopId: number,
  dateFrom: string,
  dateTo: string
): Promise<any[]> {
  const apiKey = await getHilltopKey(userId);
  const res = await api(apiKey).get(`/advertiser/campaign/${hilltopId}/stats/zones`, {
    params: { dateFrom, dateTo },
  });
  return res.data?.zones || [];
}
