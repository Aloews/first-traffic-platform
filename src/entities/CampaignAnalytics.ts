import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Campaign } from './Campaign.js';

@Entity('campaign_analytics')
export class CampaignAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.analytics, { onDelete: 'CASCADE' })
  campaign: Campaign;

  @Column({ type: 'date' })
  date: Date;

  @Column({ default: 0 })
  impressions: number;

  @Column({ default: 0 })
  clicks: number;

  @Column({ default: 0 })
  conversions: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  spent: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  revenue: number;

  @CreateDateColumn()
  createdAt: Date;
}
