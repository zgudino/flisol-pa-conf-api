import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Conference {
  @Field(() => ID)
  @PrimaryColumn({ type: 'uuid', default: () => 'uuidv7()' })
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field()
  @Column({ type: 'timestamptz' })
  date: Date;

  @Field()
  @Column()
  venue: string;

  @Field(() => Int)
  @Column()
  capacity: number;
}
