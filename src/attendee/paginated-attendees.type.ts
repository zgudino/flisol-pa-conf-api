import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination/paginated-result';
import { Attendee } from './attendee.entity';

@ObjectType()
export class PaginatedAttendees extends Paginated(Attendee) {}
