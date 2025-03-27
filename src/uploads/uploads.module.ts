import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadSchema } from './schemas/upload.schema';
import { Upload } from './schemas/upload.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadsService } from './uploads.service';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Upload.name, schema: UploadSchema }]),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
