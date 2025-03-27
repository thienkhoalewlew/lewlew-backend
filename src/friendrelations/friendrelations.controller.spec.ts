import { Test, TestingModule } from '@nestjs/testing';
import { FriendrelationsController } from './friendrelations.controller';

describe('FriendrelationsController', () => {
  let controller: FriendrelationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendrelationsController],
    }).compile();

    controller = module.get<FriendrelationsController>(FriendrelationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
