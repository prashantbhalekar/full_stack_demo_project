import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { AuthGuard } from "../common/auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import { User } from "@prisma/client";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register/customer")
  registerCustomer(@Body() dto: RegisterDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post("register/vendor")
  registerVendor(@Body() dto: RegisterDto) {
    return this.authService.registerVendor(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post("logout")
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto);
  }

  @UseGuards(AuthGuard)
  @Get("me")
  me(@CurrentUser() user: User) {
    return this.authService.me(user.id);
  }
}
