import { Resolver, Query, Args } from '@nestjs/graphql';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@Resolver(() => Company)
export class CompanyResolver {
  constructor(private companyService: CompanyService) {}

  @Public()
  @Query(() => [Company])
  async findAllCompanies(
    @Args('query', { type: () => String, nullable: true }) query?: string,
  ) {
    return this.companyService.findAllCompanies(query);
  }
}
