import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRegisterInput } from './dto/admin-register.input';
import { AdminLoginInput } from './dto/admin-login.input';
import { AdminDashboard } from './dto/admin-dashboard.type';
import { Public } from 'src/auth/decorators/public.decorator';
import { AdminGuard } from './guards/admin.guard';
import { AdminUsersResponse } from './dto/admin-users.type';
import { AdminUsersInput } from './dto/admin-users.input';
import { AdminToggleUserInput } from './dto/admin-toggle-user.input';
import { User } from 'src/user/user.entity';
import { AdminEMSListResponse } from './dto/admin-ems-list.type';
import { AdminEMSListInput } from './dto/admin-ems-list.input';
import { Company } from 'src/company/entities/company.entity';
import { AdminToggleCompanyInput } from './dto/admin-toggle-company.input';
import { AdminRFQListResponse } from './dto/admin-rfq-list.type';
import { AdminRFQListInput } from './dto/admin-rfq-list.input';
import { AdminProjectListResponse } from './dto/admin-project-list.type';
import { AdminProjectListInput } from './dto/admin-project-list.input';
import { AdminBidListResponse } from './dto/admin-bid-list.type';
import { AdminBidListInput } from './dto/admin-bid-list.input';

@Resolver()
export class AdminResolver {
    constructor(private adminService: AdminService) { }

    /* ---------- PUBLIC ---------- */


    @Public()
    @Mutation(() => String)
    async adminRegister(@Args('data') data: AdminRegisterInput) {
        await this.adminService.register(data);
        return 'Admin registered successfully';
    }

    @Public()
    @Mutation(() => String)
    async adminLogin(@Args('data') data: AdminLoginInput) {
        const res = await this.adminService.login(data);
        return res.accessToken;
    }

    /* ---------- PROTECTED ---------- */

    @UseGuards(AdminGuard)
    @Query(() => String)
    adminTest() {
        return 'Admin API working';
    }

    @UseGuards(AdminGuard)
    @Query(() => AdminDashboard)
    adminDashboard() {
        return this.adminService.getDashboard();
    }

    @UseGuards(AdminGuard)
    @Query(() => AdminUsersResponse)
    adminUsers(@Args('input') input: AdminUsersInput) {
        return this.adminService.getUsers(input);
    }

    @UseGuards(AdminGuard)
    @Mutation(() => User)
    adminToggleUser(
        @Args('input') input: AdminToggleUserInput,
    ) {
        return this.adminService.toggleUserStatus(input);
    }


    @UseGuards(AdminGuard)
    @Query(() => AdminEMSListResponse)
    adminEMSCompanies(@Args('input') input: AdminEMSListInput) {
        return this.adminService.getEMSCompanies(input);
    }

    @UseGuards(AdminGuard)
    @Mutation(() => Company)
    adminToggleCompany(
        @Args('input') input: AdminToggleCompanyInput,
    ) {
        return this.adminService.toggleCompanyStatus(input);
    }

    @UseGuards(AdminGuard)
    @Query(() => AdminRFQListResponse)
    adminRFQs(@Args('input') input: AdminRFQListInput) {
        return this.adminService.getRFQs(input);
    }


    @UseGuards(AdminGuard)
    @Query(() => AdminProjectListResponse)
    adminProjects(@Args('input') input: AdminProjectListInput) {
        return this.adminService.getProjects(input);
    }


    @UseGuards(AdminGuard)
    @Query(() => AdminBidListResponse)
    adminBids(@Args('input') input: AdminBidListInput) {
        return this.adminService.getBids(input);
    }


}
