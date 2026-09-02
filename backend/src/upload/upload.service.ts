import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_S3_REGION', 'ap-south-1');
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', '');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    } as any);

    if (!this.bucket) {
      this.logger.warn('AWS_S3_BUCKET is not set. File uploads will fail.');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ key: string; url: string }> {
    if (!this.bucket) {
      throw new BadRequestException('S3 bucket is not configured. Contact administrator.');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = this.getPublicUrl(key);
    this.logger.log(`File uploaded to S3: ${key}`);

    return { key, url };
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.bucket || !key) return;

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${key}`, error);
    }
  }

  getPublicUrl(key: string): string {
    if (!key) return '';
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async getPresignedUploadUrl(
    folder: string,
    extension: string,
    contentType: string,
  ): Promise<{ presignedUrl: string; key: string; publicUrl: string }> {
    if (!this.bucket) {
      throw new BadRequestException('S3 bucket is not configured. Contact administrator.');
    }

    const key = `${folder}/${randomUUID()}.${extension.replace('.', '')}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    // URL expires in 5 minutes
    const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const publicUrl = this.getPublicUrl(key);

    return { presignedUrl, key, publicUrl };
  }
}
