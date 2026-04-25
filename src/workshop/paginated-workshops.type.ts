import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common/pagination/paginated-result';
import { Workshop } from './workshop.entity';

@ObjectType()
export class PaginatedWorkshops extends Paginated(Workshop) {}
