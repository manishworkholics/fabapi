import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { EMSService } from './ems.service';
import { EMS } from './entities/ems.entity';
import { EMSManufacturer } from './entities/ems-manufacturer.entity';

@Resolver(() => EMS)
export class EMSResolver {
  constructor(private readonly emsService: EMSService) {}

  @Query(() => [EMS], { name: 'ems' })
  ems() {
    return this.emsService.findAllEMS();
  }

  @Query(() => [EMS])
  availableEMS() {
    return this.emsService.findAvailableEMS();
  }

  @Query(() => EMS)
  emsDetails(@Args('id', { type: () => Int }) id: number) {
    return this.emsService.emsDetails(id);
  }

  // EMS Manufacturer queries
  @Query(() => [EMSManufacturer], {
    name: 'emsManufacturers',
    description: 'Get all EMS manufacturers',
  })
  emsManufacturers() {
    return this.emsService.findAllManufacturers();
  }

  @Query(() => EMSManufacturer, {
    nullable: true,
    description: 'Get a specific EMS manufacturer by ID',
  })
  emsManufacturer(@Args('id', { type: () => Int }) id: number) {
    return this.emsService.findManufacturerById(id);
  }

  @Query(() => [EMSManufacturer], {
    description:
      'Search EMS manufacturers by name, location, certifications, industries, or type',
  })
  searchEMSManufacturers(@Args('query', { type: () => String }) query: string) {
    return this.emsService.searchManufacturers(query);
  }

  @Query(() => [EMSManufacturer], {
    description: 'Find EMS manufacturers by location',
  })
  emsManufacturersByLocation(
    @Args('location', { type: () => String }) location: string,
  ) {
    return this.emsService.findManufacturersByLocation(location);
  }

  @Query(() => [EMSManufacturer], {
    name: 'emsManufacturersOnly',
    description: 'Get all EMS manufacturers only (excludes pure suppliers)',
  })
  emsManufacturersOnly() {
    return this.emsService.findOnlyManufacturers();
  }

  @Query(() => [EMSManufacturer], {
    name: 'emsSuppliersOnly',
    description: 'Get all EMS suppliers only (excludes pure manufacturers)',
  })
  emsSuppliersOnly() {
    return this.emsService.findOnlySuppliers();
  }

  @Query(() => [EMSManufacturer], {
    description: 'Find EMS manufacturers by location (only manufacturers)',
  })
  emsManufacturersByLocationAndType(
    @Args('location', { type: () => String }) location: string,
  ) {
    return this.emsService.findManufacturersByLocationAndType(location);
  }

  @Query(() => [EMSManufacturer], {
    description: 'Find EMS suppliers by location',
  })
  emsSuppliersByLocation(
    @Args('location', { type: () => String }) location: string,
  ) {
    return this.emsService.findSuppliersByLocation(location);
  }
}
