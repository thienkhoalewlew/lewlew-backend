import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Upload, UploadDocument } from './schemas/upload.schema';
import { Model } from 'mongoose';
import { SaveImageInfoDto } from './dto/save-image-info.dto';
import { create } from 'domain';

@Injectable()
export class UploadsService {
    constructor(
        @InjectModel(Upload.name) private uploadModel: Model<UploadDocument>,
    ) {}

    async saveImangeInfo(dto: SaveImageInfoDto, userId: string): Promise<Upload> {
        const upload = new this.uploadModel({
            user: userId,
            filename: dto.filename,
            originalname: dto.originalname,
            mimetype: dto.mimetype,
            path: dto.url,
            size: dto.size,
            status: 'completed',
            metadata: dto.metadata,
        });

        return upload.save();
    }

    async deleteImage(fileId: string, userId: string): Promise<void> {
        const file = await this.uploadModel.findById(fileId);
        if(!file){
            throw new Error('File not found');
        }

        if(file.user.toString() !== userId){
            throw new Error('You do not have permission to delete this file');
        }
        
        await file.deleteOne();
    }

    async getUploadedImanges(userId: string): Promise<Upload[]> {
        return this.uploadModel.find({ user: userId}).sort({ createdAt: -1}).exec();
    }
}
