import {
  ObjectType,
  Field,
  GraphQLISODateTime,
  registerEnumType,
  Int,
} from '@nestjs/graphql';
import { User } from 'src/user/user.entity';
import { Bid } from './bid.entity';
import { IsIn } from 'class-validator';
import { ProjectDTO } from 'src/projects/entities/project.entity';

@ObjectType()
export class Quote {
  @Field(() => Int)
  id: number;

  @Field(() => String, { nullable: true })
  quoteId: string;

  @Field(() => User)
  user: User;

  @Field(() => String)
  quoteName: string;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => [String])
  quoteMaterials: string[];

  @Field(() => Number, { nullable: true })
  pcbBoards?: number;

  @Field(() => Number, { nullable: true })
  stencils?: number;

  @Field(() => Number, { nullable: true })
  components?: number;

  @Field(() => Number, { nullable: true })
  @IsIn([3, 5, 10])
  turnTime: number;

  @Field(() => [String])
  quoteFiles: string[];

  @Field(() => QuoteType)
  quoteType: QuoteType;

  @Field(() => QuoteStatus)
  status: QuoteStatus;

  @Field(() => [Bid], { nullable: true })
  bids?: Bid[];

  @Field(() => Number)
  budget: number;

  @Field(() => Int, { nullable: true })
  assignedEMSId: number;

  @Field(() => User, { nullable: true })
  assignedEMS: User;

  @Field(() => Boolean)
  isArchived: boolean;

  @Field(() => Boolean)
  hasNDA: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt: string;

  @Field(() => GraphQLISODateTime)
  updatedAt: string;

  @Field(() => Boolean, { nullable: true })
  userSignedNDA: boolean;

  @Field(() => [String], { nullable: true })
  numberOfBoards: string[];

  @Field(() => ProjectDTO, { nullable: true })
  project?: ProjectDTO;
}

export enum QuoteType {
  OPEN_QUOTE = 'OPEN_QUOTE',
  FIXED_QUOTE = 'FIXED_QUOTE',
  QUICK_QUOTE = 'QUICK_QUOTE',
}

export enum QuoteStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  WITHDRAWN = 'WITHDRAWN',

}

registerEnumType(QuoteType, {
  name: 'QuoteType',
  description: 'quote types',
});

registerEnumType(QuoteStatus, {
  name: 'QuoteStatus',
  description: 'quote status',
});
