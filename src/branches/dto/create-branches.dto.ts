import { IsString } from "class-validator";
export class CreateBranchesDto {
    @IsString()
    name: string;
}