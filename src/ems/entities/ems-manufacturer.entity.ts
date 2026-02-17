import { Field, ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class EMSManufacturer {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  employees?: string;

  @Field({ nullable: true })
  certifications?: string;

  @Field({ nullable: true })
  industries?: string;

  @Field({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  emsType?: string;

  @Field({ nullable: true })
  manufacturingSpecifications?: string;

  @Field({ nullable: true })
  assemblySpecifications?: string;

  @Field({ nullable: true })
  capabilities?: string;

  @Field({ nullable: true })
  equipment?: string;

  @Field({ nullable: true })
  constraints?: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
