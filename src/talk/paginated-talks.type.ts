import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination/paginated-result';
import { Talk } from './talk.entity';

@ObjectType()
export class PaginatedTalks extends Paginated(Talk) {}
