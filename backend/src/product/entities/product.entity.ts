import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('products') // Must match Supabase table name
export class Product {
  @PrimaryColumn()
  asin: string; // The ID (e.g., B09B96TG33)

  @Column()
  title: string;

  @Column({ name: 'img_url', nullable: true })
  img_url: string;

  @Column('float', { nullable: true })
  price: number;

  @Column('float', { nullable: true })
  stars: number;

  @Column('int', { nullable: true })
  reviews: number;

  @Column({ name: 'category_name', nullable: true })
  category_name: string;
}