import { IsString, IsEmail, IsOptional, MinLength, IsStrongPassword } from 'class-validator';
export class CreateUserDto {
    @IsString()
    name: string;

    @IsEmail()
    @IsOptional()
    email: string;
    
    @IsString()
    @MinLength(6)
    @IsStrongPassword({ minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 }, { message: 'كلمة المرور يجب ان تحتوي على حرف كبير واحد على الاقل، حرف صغير واحد على الاقل， رقم واحد على الاقل' })
    password: string;

    @IsString()
    @IsOptional()
    phone: string;

    @IsString()
    @IsOptional()
    image: string;

    @IsString()
    roleId: string;

    @IsString()
    branchId: string;

    @IsString()
    username: string;

}