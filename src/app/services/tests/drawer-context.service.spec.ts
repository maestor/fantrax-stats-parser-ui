import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DrawerContextService } from '../drawer-context.service';

describe('DrawerContextService', () => {
    it('should default maxGames to 0', async () => {
        TestBed.configureTestingModule({ providers: [DrawerContextService] });
        const service = TestBed.inject(DrawerContextService);

        await expect(firstValueFrom(service.playerMaxGames$)).resolves.toEqual(0);
        await expect(firstValueFrom(service.goalieMaxGames$)).resolves.toEqual(0);
    });

    it('should set and normalize maxGames per context', async () => {
        TestBed.configureTestingModule({ providers: [DrawerContextService] });
        const service = TestBed.inject(DrawerContextService);

        service.setMaxGames('player', 10.9);
        service.setMaxGames('goalie', -5);

        await expect(firstValueFrom(service.playerMaxGames$)).resolves.toEqual(10);
        await expect(firstValueFrom(service.goalieMaxGames$)).resolves.toEqual(0);
    });

    it('should keep the other context unchanged', async () => {
        TestBed.configureTestingModule({ providers: [DrawerContextService] });
        const service = TestBed.inject(DrawerContextService);

        service.setMaxGames('player', 12);

        await expect(firstValueFrom(service.playerMaxGames$)).resolves.toEqual(12);
        await expect(firstValueFrom(service.goalieMaxGames$)).resolves.toEqual(0);
    });

    it('should no-op when setting the same value and normalize non-finite values to 0', async () => {
        TestBed.configureTestingModule({ providers: [DrawerContextService] });
        const service = TestBed.inject(DrawerContextService);

        service.setMaxGames('player', 5);
        service.setMaxGames('player', 5);
        service.setMaxGames('goalie', Number.NaN);

        await expect(firstValueFrom(service.playerMaxGames$)).resolves.toEqual(5);
        await expect(firstValueFrom(service.goalieMaxGames$)).resolves.toEqual(0);
    });
});
