import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    const secretKey = process.env.JWT_SECRET || 'secret';
    console.log('JWT Strategy using secret key:', secretKey);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }
  async validate(payload: JwtPayload) {
    console.log('JWT Strategy validating payload:', payload);
    try {
      const user = await this.authService.validateUser(payload.sub);
      if (!user) {
        console.log('User not found for ID:', payload.sub);
        throw new UnauthorizedException('User not found');
      }
      
      // Trả về đối tượng đơn giản chỉ chứa userId và phoneNumber
      console.log('User validated successfully, ID:', payload.sub);
      return { userId: payload.sub, phoneNumber: payload.phoneNumber };
    } catch (error) {
      console.error('JWT validation error:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }
}
