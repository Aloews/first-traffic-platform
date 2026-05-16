import axios from 'axios';

const HILLTOP_API = 'https://api.hilltopads.com/v1';
const API_KEY = process.env.HILLTOP_API_KEY || '';

const http = axios.create({
  baseURL: HILLTOP_API,
  timeout: 10000,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HilltopCampaignCreate {
  name: string;
  url: string;
  rate: number;                  // CPM in USD
  totalBudget?: number;
  dailyBudget?: number;
  geo?: string[];                // ['US', 'GB', 'DE']
  browser?: string[];            // ['Chrome', 'Safari']
  device?: string[];             // ['Desktop', 'Mobile/smartphone']
  os?: string[];
  active?: boolean;
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

// ─── Campaign Management ──────────────────────────────────────────────────────

export async function createHilltopCampaign(data: HilltopCampaignCreate): Promise<HilltopCampaign> {
  const targeting: Record<string, any> = {};

  if (data.geo?.length) {
    targeting.geo = { operator: 'in', operand: data.geo };
  }
  if (data.browser?.length) {
    targeting.browser = { operator: 'in', operand: data.browser };
  }
  if (data.device?.length) {
    targeting.device = { operator: 'in', operand: data.device };
  }
  if (data.os?.length) {
    targeting.os = { operator: 'in', operand: data.os };
  }

  const payload: Record<string, any> = {
    format: 'Banner',
    channels: ['Mainstream High Activity', 'Mainstream Medium Activity'],
    type: 'CPM',
    rate: data.rate,
    name: data.name,
    url: encodeURIComponent(data.url),
    active: data.active ?? false,
    capTotal: 3,
    capResetAfter: 24,
    capForCampaign: 'campaign',
    filters: { Proxy: 'Disallow' },
  };

  if (data.totalBudget) payload.limitBudgetTotal = String(data.totalBudget);
  if (data.dailyBudget) payload.limitBudgetDaily = String(Math.max(20, data.dailyBudget));
  if (Object.keys(targeting).length) payload.targeting = targeting;

  const res = await http.post(`/advertiser/campaign?key=${API_KEY}`, payload);
  return res.data;
}

export async function getHilltopCampaign(hilltopId: number): Promise<HilltopCampaign> {
  const res = await http.get(`/advertiser/campaign/${hilltopId}?key=${API_KEY}`);
  return res.data;
}

export async function listHilltopCampaigns(): Promise<HilltopCampaign[]> {
  const res = await http.get(`/advertiser/campaigns?key=${API_KEY}`);
  return res.data?.campaigns || [];
}

export async function updateHilltopBid(hilltopId: number, rate: number): Promise<void> {
  await http.patch(`/advertiser/campaign/${hilltopId}?key=${API_KEY}`, { rate });
}

export async function pauseHilltopCampaign(hilltopId: number): Promise<void> {
  await http.post(`/advertiser/campaign/${hilltopId}/stop?key=${API_KEY}`);
}

export async function activateHilltopCampaign(hilltopId: number): Promise<void> {
  await http.post(`/advertiser/campaign/${hilltopId}/activate?key=${API_KEY}`);
}

export async function archiveHilltopCampaign(hilltopId: number): Promise<void> {
  await http.post(`/advertiser/campaign/${hilltopId}/archive?key=${API_KEY}`);
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export async function getHilltopStats(
  hilltopId: number,
  dateFrom: string,
  dateTo: string
): Promise<HilltopStats> {
  const res = await http.get(`/advertiser/campaign/${hilltopId}/stats?key=${API_KEY}`, {
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
  hilltopId: number,
  dateFrom: string,
  dateTo: string
): Promise<any[]> {
  const res = await http.get(`/advertiser/campaign/${hilltopId}/stats/zones?key=${API_KEY}`, {
    params: { dateFrom, dateTo },
  });
  return res.data?.zones || [];
}
