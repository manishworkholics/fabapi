import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from 'src/user/user.entity';
import { Quote } from 'src/quote/entities/quote.entity';
import { ProjectStatus } from '../enums/project-status.enum';

@ObjectType()
export class ProjectDTO {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  quoteId: string;

  @Field(() => Quote)
  quote: Quote;

  @Field(() => Int)
  pmId: number;

  @Field(() => User)
  pm: User;

  @Field(() => Int)
  emsId: number;

  @Field(() => User)
  ems: User;

  @Field(() => ProjectStatus)
  status: ProjectStatus;

  @Field(() => Date)
  createdAt: Date;
}
