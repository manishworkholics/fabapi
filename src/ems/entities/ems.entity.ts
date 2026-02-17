import { Field, ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { EMSAvailabilityStatus } from '../../common/enums/ems-availability-status.enum';


@ObjectType()
export class EMS {
  @Field(() => ID)
  id: number;

  @Field({ nullable: true })
  username: string;

  @Field()
  email: string;

  @Field()
  location: string;

  @Field(() => String, { nullable: true })
  firstName?: string;

  @Field(() => String, { nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => EMSAvailabilityStatus, { nullable: true })
  EMSAvailabilityStatus?: EMSAvailabilityStatus;

  @Field(() => GraphQLISODateTime)
  createdAt: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  verifiedAt?: string;

  @Field(() => GraphQLISODateTime)
  updatedAt: string;
}
