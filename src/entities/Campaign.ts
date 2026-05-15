import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { RTBAuction } from './RTBAuction';
import { CampaignAnalytics } from './CampaignAnalytics';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalBudget: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  spent: number;

  @Column({
    type: 'enum',
    enum: ['ROI_OPTIMIZED', 'CPA', 'CPM', 'CPC'],
    default: 'ROI_OPTIMIZED',
  })
  bidStrategy: string;

  @Column('jsonb', { default: {} })
  targeting: Record<string, any>;

  @Column('jsonb', { default: {} })
  trafficSources: Record<string, any>[];

  @Column({
    type: 'enum',
    enum: ['paused', 'active', 'completed'],
    default: 'paused',
  })
  status: string;

  @Column({ nullable: true })
  launchedAt: Date;

  @ManyToOne(() => User, (user) => user.campaigns, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => RTBAuction, (auction) => auction.campaign)
  auctions: RTBAuction[];

  @OneToMany(() => CampaignAnalytics, (analytics) => analytics.campaign)
  analytics: CampaignAnalytics[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
