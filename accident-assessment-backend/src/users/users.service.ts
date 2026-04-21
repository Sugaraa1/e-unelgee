import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
        throw new ConflictException('Энэ утасны дугаар аль хэдийн бүртгэлтэй байна');
      }
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }
}