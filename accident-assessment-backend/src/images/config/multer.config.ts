// src/images/config/multer.config.ts
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// ── Зөвшөөрөгдсөн MIME types ──────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// ── Max file size: 5MB ────────────────────────────────────────
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// ── Multer options ─────────────────────────────────────────────
export const multerOptions = {
  // Файл хадгалах тохиргоо
  storage: diskStorage({
    destination: './uploads',

    filename: (_req: Request, file: Express.Multer.File, callback) => {
      // UUID ашиглаж давтагдашгүй нэр үүсгэнэ
      // Жишэ: a3f8c2d1-4b5e-4c6f-8d9e-0a1b2c3d4e5f.jpg
      const uniqueName = uuidv4();
      const extension = extname(file.originalname).toLowerCase() || '.jpg';
      callback(null, `${uniqueName}${extension}`);
    },
  }),

  // File type шалгах
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Зөвхөн JPEG эсвэл PNG зураг upload хийх боломжтой. Одоогийн файлын төрөл: ${file.mimetype}`,
        ),
        false,
      );
    }
    callback(null, true);
  },

  // Max file size
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};