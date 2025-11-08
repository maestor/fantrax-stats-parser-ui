import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatSliderModule } from '@angular/material/slider';
import { Subject, takeUntil } from 'rxjs';
import { FilterService, FilterState } from '@services/filter.service';

@Component({
  selector: 'app-min-games-slider',
  imports: [TranslateModule, MatSliderModule],
  templateUrl: './min-games-slider.component.html',
  styleUrl: './min-games-slider.component.scss',
})
export class MinGamesSliderComponent implements OnInit, OnDestroy, OnChanges {
  @Input() context: 'player' | 'goalie' = 'player';
  @Input() maxGames = 0;

  minGames = 0;
  private filterService = inject(FilterService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    const filters$ =
      this.context === 'goalie'
        ? this.filterService.goalieFilters$
        : this.filterService.playerFilters$;
    filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filters: FilterState) => {
        this.minGames = filters.minGames;
      });
  }

  onSliderInput(event: any) {
    // event is MatSliderChange; using any avoids template inference issues under strict mode
    const value = Number(event.value) || 0;
    this.updateValue(value);
  }

  onSliderChange(event: any) {
    const value = Number(event.value) || 0;
    this.updateValue(value);
  }

  onThumbInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value) || 0;
    this.updateValue(value);
  }

  private updateValue(value: number) {
    if (this.context === 'goalie') {
      this.filterService.updateGoalieFilters({ minGames: value });
    } else {
      this.filterService.updatePlayerFilters({ minGames: value });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['maxGames'] && !changes['maxGames'].firstChange) {
      const newMax = changes['maxGames'].currentValue as number;
      if (this.minGames > newMax) {
        // If previous minGames exceeds new maxGames, reset to maximum allowed
        this.minGames = newMax;
        this.updateValue(newMax);
      }
    }
  }
}
