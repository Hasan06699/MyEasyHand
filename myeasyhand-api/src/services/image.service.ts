import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { ValidationError } from '../common/errors/AppError';
import { NsfwModerationService } from './nsfw-moderation.service';

const CATEGORY_IMAGE_SIZE = 512;
const SERVICE_IMAGE_SIZE = 512;
const SERVICE_GALLERY_WIDTH = 900;
const SERVICE_GALLERY_HEIGHT = 500;
const SERVICE_IMAGE_MAX_BYTES = 1024 * 1024;
const CATEGORY_SUBDIR = 'categories';
const SERVICE_SUBDIR = 'services';
const GALLERY_SUBDIR = 'service-gallery';
const DOCUMENTS_SUBDIR = 'documents';

const PROMOTION_BG_SUBDIR = 'promotion-backgrounds';
const PROMOTION_BG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PROMOTION_BG_VIDEO_MAX_BYTES = 10 * 1024 * 1024;
const PROMOTION_BG_WIDTH = 1920;
const PROMOTION_BG_HEIGHT = 600;

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export class ImageService {
  private static assertImageType(mimetype: string): void {
    if (!ALLOWED_IMAGE_TYPES.includes(mimetype)) {
      throw new ValidationError('Only JPG, JPEG, PNG, and WEBP images are allowed');
    }
  }

  private static assertMaxSize(buffer: Buffer, maxBytes: number): void {
    if (buffer.length > maxBytes) {
      throw new ValidationError(`Image must not exceed ${maxBytes / (1024 * 1024)} MB`);
    }
  }

  private static async assertSafeImage(buffer: Buffer): Promise<void> {
    await NsfwModerationService.assertImageSafe(buffer);
  }

  static async processCategoryImage(buffer: Buffer, mimetype: string): Promise<string> {
    this.assertImageType(mimetype);
    await this.assertSafeImage(buffer);

    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new ValidationError('Invalid image file');
    }

    const uploadDir = path.join(config.upload.storagePath, CATEGORY_SUBDIR);
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    await sharp(buffer)
      .resize(CATEGORY_IMAGE_SIZE, CATEGORY_IMAGE_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    return `/uploads/${CATEGORY_SUBDIR}/${filename}`;
  }

  static async processServiceImage(buffer: Buffer, mimetype: string): Promise<string> {
    this.assertImageType(mimetype);
    this.assertMaxSize(buffer, SERVICE_IMAGE_MAX_BYTES);
    await this.assertSafeImage(buffer);

    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new ValidationError('Invalid image file');
    }

    const uploadDir = path.join(config.upload.storagePath, SERVICE_SUBDIR);
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    await sharp(buffer)
      .resize(SERVICE_IMAGE_SIZE, SERVICE_IMAGE_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    return `/uploads/${SERVICE_SUBDIR}/${filename}`;
  }

  static async processServiceGalleryImage(buffer: Buffer, mimetype: string): Promise<string> {
    this.assertImageType(mimetype);
    this.assertMaxSize(buffer, SERVICE_IMAGE_MAX_BYTES);
    await this.assertSafeImage(buffer);

    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new ValidationError('Invalid image file');
    }

    const uploadDir = path.join(config.upload.storagePath, GALLERY_SUBDIR);
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    await sharp(buffer)
      .resize(SERVICE_GALLERY_WIDTH, SERVICE_GALLERY_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    return `/uploads/${GALLERY_SUBDIR}/${filename}`;
  }

  static async processDocument(buffer: Buffer, mimetype: string, originalName: string): Promise<string> {
    const allowedDocTypes = [
      ...ALLOWED_IMAGE_TYPES,
      'application/pdf',
    ];
    if (!allowedDocTypes.includes(mimetype)) {
      throw new ValidationError('Only JPG, JPEG, PNG, WEBP, and PDF files are allowed');
    }
    this.assertMaxSize(buffer, 5 * 1024 * 1024);

    if (mimetype.startsWith('image/')) {
      await this.assertSafeImage(buffer);
    }

    const uploadDir = path.join(config.upload.storagePath, DOCUMENTS_SUBDIR);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(originalName) || (mimetype === 'application/pdf' ? '.pdf' : '.webp');
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    if (mimetype.startsWith('image/')) {
      await sharp(buffer).webp({ quality: 85 }).toFile(filepath.replace(ext, '.webp'));
      return `/uploads/${DOCUMENTS_SUBDIR}/${filename.replace(ext, '.webp')}`;
    }

    await fs.writeFile(filepath, buffer);
    return `/uploads/${DOCUMENTS_SUBDIR}/${filename}`;
  }

  static getPublicUrl(relativePath: string): string {
    return `${config.appUrl}${relativePath}`;
  }

  static async deleteByUrl(imageUrl?: string): Promise<void> {
    if (!imageUrl) return;

    let relative = imageUrl;
    if (imageUrl.includes('/uploads/')) {
      relative = imageUrl.substring(imageUrl.indexOf('/uploads/'));
    }
    if (!relative.startsWith('/uploads/')) return;

    const filepath = path.join(config.upload.storagePath, relative.replace('/uploads/', ''));
    try {
      await fs.unlink(filepath);
    } catch {
      // file may already be removed
    }
  }

  static async processPromotionBackgroundImage(buffer: Buffer, mimetype: string): Promise<string> {
    this.assertImageType(mimetype);
    this.assertMaxSize(buffer, PROMOTION_BG_IMAGE_MAX_BYTES);
    await this.assertSafeImage(buffer);

    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new ValidationError('Invalid image file');
    }

    const uploadDir = path.join(config.upload.storagePath, PROMOTION_BG_SUBDIR);
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    await sharp(buffer)
      .resize(PROMOTION_BG_WIDTH, PROMOTION_BG_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    return `/uploads/${PROMOTION_BG_SUBDIR}/${filename}`;
  }

  static async processPromotionBackgroundVideo(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
  ): Promise<string> {
    if (!ALLOWED_VIDEO_TYPES.includes(mimetype)) {
      throw new ValidationError('Only MP4, WebM, and MOV videos are allowed');
    }
    this.assertMaxSize(buffer, PROMOTION_BG_VIDEO_MAX_BYTES);

    const uploadDir = path.join(config.upload.storagePath, PROMOTION_BG_SUBDIR);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(originalName) || (mimetype === 'video/webm' ? '.webm' : '.mp4');
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);
    return `/uploads/${PROMOTION_BG_SUBDIR}/${filename}`;
  }
}
