import { IsString, IsArray } from "class-validator";

export class CreateRoleDto {
  
    @IsString()
    name: string;

    @IsString({ each: true })
    permissions: string[];
}