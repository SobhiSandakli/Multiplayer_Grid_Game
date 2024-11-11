import { Test, TestingModule } from '@nestjs/testing';
import { TurnGateway } from './turn.gateway';

describe('TurnGateway', () => {
  let gateway: TurnGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TurnGateway],
    }).compile();

    gateway = module.get<TurnGateway>(TurnGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
