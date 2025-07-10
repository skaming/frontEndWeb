// src/app/microorm/tableslist.component.ts

import { Component, Input, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tableslist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-list-container">
      <h3>Список таблиц</h3>

      <div *ngIf="loading">🔄 Загрузка...</div>
      <div *ngIf="error" class="error">⚠️ {{ error }}</div>

      <ul *ngIf="!loading && entities.length > 0">
        <li
          *ngFor="let entity of entities"
          (click)="select(entity)"
          [class.active]="selectedEntity() === entity"
        >
          {{ entity }}
        </li>
      </ul>

      <div *ngIf="!loading && entities.length === 0 && !error">
        ❕ Нет доступных таблиц
      </div>
    </div>
  `,
  styles: [`
    .table-list-container {
      h3 {
        margin-bottom: 1rem;
        font-size: 1.2rem;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 0.5rem;
          margin-bottom: 0.2rem;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s;

          &:hover {
            background-color: #f0f0f0;
          }

          &.active {
            background-color: #28292b;
            color: #fff;
            font-weight: bold;
          }
        }
      }

      .error {
        color: red;
        font-size: 0.9rem;
      }
    }
  `]
})
export class TableslistComponent implements OnInit {
  @Input({ required: true }) selectedEntity!: WritableSignal<string | null>;
  @Input({ required: true }) getEntityNames!: () => Observable<string[]>;

  entities: string[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.getEntityNames().subscribe({
      next: (data) => {
        this.entities = data;
        this.loading = false;

        // Если ещё не выбрана таблица — установить первую
        if (!this.selectedEntity() && this.entities.length > 0) {
          this.selectedEntity.set(this.entities[0]);
        }
      },
      error: () => {
        this.error = 'Не удалось загрузить список таблиц';
        this.loading = false;
      }
    });
  }

  select(entity: string) {
    if (this.selectedEntity() !== entity) {
      this.selectedEntity.set(entity);
    }
  }
}
