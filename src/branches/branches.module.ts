import { Module } from "@nestjs/common";
import { Branch } from "./entities/branch.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BranchesController } from "./branches.controller";
import { BranchesService } from "./branches.service";
@Module({
  imports: [
    TypeOrmModule.forFeature([Branch]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService, TypeOrmModule],}
)
export class BranchesModule {}