import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination/paginated-result';
import { Conference } from '../conference/conference.entity';

@ObjectType()
export class PaginatedConferences extends Paginated(Conference) {}
