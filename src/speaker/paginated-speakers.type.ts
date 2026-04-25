import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination/paginated-result';
import { Speaker } from './speaker.entity';

@ObjectType()
export class PaginatedSpeakers extends Paginated(Speaker) {}
