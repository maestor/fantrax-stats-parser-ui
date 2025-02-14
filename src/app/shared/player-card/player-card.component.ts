import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Player, Goalie } from '@services/api.service';

@Component({
  selector: 'app-player-card',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    TranslateModule,
  ],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
  readonly dialogRef = inject(MatDialogRef<PlayerCardComponent>);
  readonly data = inject<Player | Goalie>(MAT_DIALOG_DATA);
  stats = Object.keys(this.data)
    .filter((key) => !key.includes('name'))
    .map((key) => ({
      label: `tableColumn.${key}`,
      value: this.data[key as keyof typeof this.data],
    }));
  displayedColumns: string[] = ['label', 'value'];

  onNoClick(): void {
    this.dialogRef.close();
  }
}
