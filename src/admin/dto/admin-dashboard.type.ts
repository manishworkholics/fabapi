import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdminDashboard {
  @Field()
  totalUsers: number;

  @Field()
  totalEMS: number;

  @Field()
  totalPM: number;

  @Field()
  totalRFQs: number;

  @Field()
  totalProjects: number;
}
