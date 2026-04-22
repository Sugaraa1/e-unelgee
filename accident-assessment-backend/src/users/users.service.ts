import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');
    return user;
  }

  async updateMe(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Утасны дугаар давхардсан эсэх шалгах
    if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
      const existing = await this.userRepository.findOne({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Энэ утасны дугаар аль хэдийн бүртгэлтэй байна',
        );
      }
    }

    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);

    // ✅ Password-гүй, refreshToken-гүй цэвэр object буцаана
    // class-transformer-ийн @Exclude() аюулгүй нь — мобайлд жагсаалт үзүүлэхэд тохиромжтой
    const { password, refreshToken, ...safe } = saved as any;
    return safe;
  }

  /**
   * Нэвтэрсэн хэрэглэгчийн нууц үгийг солих
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!currentPassword || !newPassword) {
      throw new BadRequestException(
        'Одоогийн болон шинэ нууц үг аль аль нь шаардлагатай',
      );
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Шинэ нууц үг дор хаяж 8 тэмдэгт байх ёстой');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new BadRequestException(
        'Шинэ нууц үг том, жижиг үсэг болон тоо агуулсан байх ёстой',
      );
    }

    // Одоогийн хэрэглэгчийг password-той нь авна
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Хэрэглэгч олдсонгүй');

    // Одоогийн нууц үгийг шалгах
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new UnauthorizedException('Одоогийн нууц үг буруу байна');
    }

    // Шинэ нууц үг хуучинтай ижил биш эсэх
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      throw new BadRequestException(
        'Шинэ нууц үг хуучинтай ижил байж болохгүй',
      );
    }

    // Шинэ нууц үгийг хадгалах
    // @BeforeUpdate hook bcrypt-ээр хашна
    user.password = newPassword;
    // Нууц үг солигдсон бол бүх session-г хүчингүй болгох
    user.refreshToken = null;
    await this.userRepository.save(user);

    return { message: 'Нууц үг амжилттай солигдлоо' };
  }
}