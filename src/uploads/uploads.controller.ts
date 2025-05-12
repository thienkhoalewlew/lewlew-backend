import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SaveImageInfoDto } from './dto/save-image-info.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Save uploaded image information' })
    @ApiResponse({ status: 200, description: 'Image information saved successfully' })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized access' })
    async saveImageInfo(@Body() dto: SaveImageInfoDto, @Req() req) {
        return this.uploadsService.saveImangeInfo(dto, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete uploaded image' })
    @ApiResponse({ status: 200, description: 'Image deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid data' })
    @ApiResponse({ status: 401, description: 'Unauthorized access' })
    async deleteImage(@Param('id') id: string, @Req() req) {
        return this.uploadsService.deleteImage(id, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all uploaded images of the current user' })
    @ApiResponse({ status: 200, description: 'List of uploaded images' })
    @ApiResponse({ status: 401, description: 'Unauthorized access' })
    async getUploadedImages(@Req() req) {
        return this.uploadsService.getUploadedImanges(req.user.userId);
    }
}
