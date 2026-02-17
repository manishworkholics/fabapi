import { Module } from '@nestjs/common';
import { AdminResolver } from './admin.resolver';
import { AdminService } from './admin.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
   imports: [AuthModule],
  providers: [AdminResolver, AdminService]
})
export class AdminModule {}
