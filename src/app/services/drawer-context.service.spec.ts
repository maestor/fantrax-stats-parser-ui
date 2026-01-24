import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DrawerContextService } from './drawer-context.service';

describe('DrawerContextService', () => {
  it('should default maxGames to 0', async () => {
    TestBed.configureTestingModule({ providers: [DrawerContextService] });
    const service = TestBed.inject(DrawerContextService);

    await expectAsync(firstValueFrom(service.playerMaxGames$)).toBeResolvedTo(0);
    await expectAsync(firstValueFrom(service.goalieMaxGames$)).toBeResolvedTo(0);
  });

  it('should set and normalize maxGames per context', async () => {
    TestBed.configureTestingModule({ providers: [DrawerContextService] });
    const service = TestBed.inject(DrawerContextService);

    service.setMaxGames('player', 10.9);
    service.setMaxGames('goalie', -5);

    await expectAsync(firstValueFrom(service.playerMaxGames$)).toBeResolvedTo(10);
    await expectAsync(firstValueFrom(service.goalieMaxGames$)).toBeResolvedTo(0);
  });

  it('should keep the other context unchanged', async () => {
    TestBed.configureTestingModule({ providers: [DrawerContextService] });
    const service = TestBed.inject(DrawerContextService);

    service.setMaxGames('player', 12);

    await expectAsync(firstValueFrom(service.playerMaxGames$)).toBeResolvedTo(12);
    await expectAsync(firstValueFrom(service.goalieMaxGames$)).toBeResolvedTo(0);
  });

  it('should no-op when setting the same value and normalize non-finite values to 0', async () => {
    TestBed.configureTestingModule({ providers: [DrawerContextService] });
    const service = TestBed.inject(DrawerContextService);

    service.setMaxGames('player', 5);
    service.setMaxGames('player', 5);
    service.setMaxGames('goalie', Number.NaN);

    await expectAsync(firstValueFrom(service.playerMaxGames$)).toBeResolvedTo(5);
    await expectAsync(firstValueFrom(service.goalieMaxGames$)).toBeResolvedTo(0);
  });
});
