import { Test, TestingModule } from '@nestjs/testing';
import { FriendrelationsService } from './friendrelations.service';

describe('FriendrelationsService', () => {
  let service: FriendrelationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FriendrelationsService],
    }).compile();

    service = module.get<FriendrelationsService>(FriendrelationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
