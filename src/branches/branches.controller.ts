import { Controller } from "@nestjs/common";
import { BranchesService } from "./branches.service";
import { Get , Post , Body } from "@nestjs/common";
import { CreateBranchesDto } from "./dto/create-branches.dto";

@Controller('branches')
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
  ) {}
    @Post()
async create(@Body() createBranchDto: CreateBranchesDto) {
  return this.branchesService.create(createBranchDto);
}
  @Get()
  async findAll() {
    return this.branchesService.findAll();
  }

  
}