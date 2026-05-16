import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Campaign } from './Campaign';

@Entity('rtb_auctions')
export class RTBAuction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.auctions, { onDelete: 'CASCADE' })
  campaign: Campaign;

  @Column('decimal', { precision: 10, scale: 4 })
  bidPrice: number;

  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  clearingPrice: number;

  @Column('boolean', { default: false })
  won: boolean;

  @Column('jsonb', { default: {} })
  bidRequest: Record<string, any>;

  @Column('jsonb', { default: {} })
  bidResponse: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
