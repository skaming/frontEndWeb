// src/app/microorm/tablesdata.component.ts
import { Component, Input, Signal, effect, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';
import { PaginatedResponse } from './tables.component'; // Импортируем интерфейс PaginatedResponse

@Component({
  selector: 'app-tablesdata',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section *ngIf="selectedEntity()">
      <h3>{{ selectedEntity() }}</h3>

      <div *ngIf="loading">Загрузка...</div>
      <div *ngIf="error">{{ error }}</div>

      <div class="toolbar">
        <button (click)="openSidebar()">➕ Добавить</button>
        <button (click)="saveChanges()">💾 Сохранить</button>

        <div class="pagination-controls">
          <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">←</button>
          <span>Страница {{ currentPage() }} из {{ totalPages() }} ({{ totalItems() }} строк)</span>
          <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()">→</button>
        </div>
      </div>

      <table *ngIf="!loading && data.length > 0">
        <thead>
        <tr>
          <th *ngFor="let col of getColumns()">{{ col }}</th>
          <th>Удалить</th>
        </tr>
        </thead>
        <tbody>
        <tr *ngFor="let row of data">
          <td *ngFor="let col of getColumns()">
            <input [(ngModel)]="row[col]" name="{{ row[getPrimaryKey() || 'new'] }}-{{ col }}" />
          </td>
          <td>
            <button (click)="deleteRow(row)">🗑</button>
          </td>
        </tr>
        </tbody>
      </table>

      <p *ngIf="!loading && data.length === 0 && !error">Нет данных в таблице</p>
    </section>

    <div class="sidebar" *ngIf="showSidebar">
      <h4>➕ Новая строка</h4>

      <div *ngFor="let field of fieldMetadata">
        <label>{{ field.field }}</label>

        <input
          *ngIf="field.type !== 'boolean'"
          [(ngModel)]="newRow[field.field]"
          [name]="'new-' + field.field"
          [readonly]="field.primaryKey" /><input
        *ngIf="field.type === 'boolean'"
        type="checkbox"
        [(ngModel)]="newRow[field.field]"
        [name]="'new-' + field.field"
      />
      </div>

      <div class="sidebar-buttons">
        <button (click)="confirmAddRow()">✅ Добавить</button>
        <button (click)="showSidebar = false">❌ Отмена</button>
      </div>
    </div>
  `,
  styles: [`
    section {
      padding: 1rem;
    }

    h3 {
      margin-bottom: 1rem;
    }

    .toolbar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
    }

    .pagination-controls {
      margin-left: auto;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      white-space: nowrap;
    }

    .pagination-controls button {
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
    .pagination-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 0.5rem;
      vertical-align: top;
    }

    input {
      width: 100%;
      padding: 0.3rem;
      box-sizing: border-box;
    }

    .sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      height: 100vh;
      background: #fff;
      border-left: 1px solid #ccc;
      padding: 1rem;
      box-shadow: -2px 0 5px rgba(0,0,0,0.1);
      z-index: 1000;
      overflow-y: auto;
    }

    .sidebar-buttons {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }
  `]
})
export class TablesdataComponent {
  @Input({ required: true }) selectedEntity!: Signal<string | null>;
  @Input({ required: true }) getEntityData!: (tableName: string, limit: number, offset: number) => Observable<PaginatedResponse<any>>;
  @Input({ required: true }) createEntityRow!: (tableName: string, row: any) => Observable<any>;
  @Input({ required: true }) updateEntityRow!: (tableName: string, id: string | number, row: any) => Observable<any>; // Изменил тип ID
  @Input({ required: true }) deleteEntityRow!: (tableName: string, id: string | number) => Observable<any>; // Изменил тип ID
  @Input({ required: true }) getEntityMetadata!: (tableName: string) => Observable<any[]>;
  @Input({ required: true }) currentPage!: Signal<number>;
  @Input({ required: true }) itemsPerPage!: Signal<number>;
  @Input({ required: true }) totalItems!: Signal<number>;
  @Output() pageChange = new EventEmitter<number>();

  fieldMetadata: any[] = [];
  data: any[] = [];
  originalData: any[] = [];

  loading = false;
  error: string | null = null;

  showSidebar = false;
  newRow: any = {};

  constructor() {
    effect(() => {
      const table = this.selectedEntity();
      const page = this.currentPage();
      const limit = this.itemsPerPage();

      if (!table) return;

      // При смене таблицы или страницы, перезагружаем данные
      this.loadData(table, limit, (page - 1) * limit);
    });
  }

  totalPages(): number {
    if (this.totalItems() === 0) return 0; // Избегаем деления на ноль
    return Math.ceil(this.totalItems() / this.itemsPerPage());
  }

  getPrimaryKey(): string | null {
    // Получаем имя первичного ключа из метаданных
    const pkField = this.fieldMetadata.find(f => f.primaryKey);
    return pkField ? pkField.field : null;
  }

  private loadData(table: string, limit: number, offset: number) {
    this.loading = true;
    this.error = null;

    this.getEntityData(table, limit, offset).subscribe({
      next: (response) => {
        this.data = structuredClone(response.data);
        this.originalData = structuredClone(response.data);
        // totalItems обновляется в родительском TablesComponent через tap operator
        this.loading = false;
      },
      error: (err) => {
        console.error(`Ошибка загрузки таблицы '${table}':`, err);
        this.error = `Ошибка загрузки таблицы '${table}'. Подробности в консоли.`;
        this.loading = false;
      }
    });
  }

  getColumns(): string[] {
    if (this.data.length === 0) return [];
    return Object.keys(this.data[0]);
  }

  // Обновлен для работы с различными типами ID
  generateUUID(): string {
    return crypto.randomUUID();
  }

  openSidebar() {
    const table = this.selectedEntity();
    if (!table) return;

    this.getEntityMetadata(table).subscribe({
      next: (metadata) => {
        this.fieldMetadata = metadata;

        const row: any = {};
        for (const field of metadata) {
          if (field.primaryKey) {
            // Если первичный ключ и его тип UUID, то генерируем UUID
            if (field.primaryKeyType === 'UUID') {
              row[field.field] = this.generateUUID();
            } else {
              // Для других типов первичных ключей (INTEGER, которые автоинкрементные),
              // оставляем null. Sequelize сам сгенерирует ID при вставке.
              row[field.field] = null;
            }
          } else {
            // Подстановка шаблонных значений в зависимости от типа поля и имени
            switch (field.type) {
              case 'string':
                if (field.field === 'resultBody') {
                  row[field.field] = field.allowNull ? null : `Результат обработки...`;
                } else {
                  row[field.field] = field.allowNull ? null : `Новый ${field.field} (текст)`;
                }
                break;
              case 'number':
                if (field.field === 'durationS') {
                  row[field.field] = field.allowNull ? null : 0;
                } else {
                  row[field.field] = field.allowNull ? null : 0;
                }
                break;
              case 'boolean':
                if (field.field === 'isActive') {
                  row[field.field] = false; // По умолчанию false
                } else {
                  row[field.field] = false; // Общее для всех boolean
                }
                break;
              case 'date':
                if (field.field === 'dateProcessingFinish') {
                  // Используем текущую дату в формате YYYY-MM-DD
                  row[field.field] = field.allowNull ? null : new Date().toISOString().slice(0, 10);
                } else {
                  row[field.field] = field.allowNull ? null : new Date().toISOString().slice(0, 10);
                }
                break;
              case 'object': // Если errorFileContent приходит как JSON-объект
                if (field.field === 'errorFileContent') {
                  row[field.field] = field.allowNull ? null : {}; // Пустой объект
                } else {
                  row[field.field] = field.allowNull ? null : {};
                }
                break;
              default:
                row[field.field] = field.allowNull ? null : ''; // Пустая строка по умолчанию
            }
          }
        }

        this.newRow = row;
        this.showSidebar = true;
      },
      error: (err) => {
        console.error('Ошибка загрузки метаданных:', err);
        this.error = 'Ошибка загрузки метаданных.';
      }
    });
  }

  confirmAddRow() {
    const table = this.selectedEntity();
    if (!table) {
      console.warn('Таблица не выбрана при попытке добавления.');
      return;
    }

    console.log('Попытка добавить новую строку:', this.newRow); // Лог перед отправкой

    this.createEntityRow(table, this.newRow).subscribe({
      next: (res) => {
        console.log('Строка успешно добавлена:', res); // Что вернул бэкенд
        this.showSidebar = false;
        this.newRow = {}; // Очищаем форму для новой строки
        // Перезагружаем данные на текущей странице, чтобы увидеть новую строку с ID
        this.pageChange.emit(this.currentPage());
        this.error = null; // Очищаем предыдущие ошибки
      },
      error: (err) => {
        console.error('Ошибка при добавлении строки:', err);
        this.error = `Ошибка при добавлении строки: ${err.message || err.error?.message || 'Неизвестная ошибка'}`;
        // Добавьте alert или Toast, чтобы пользователь видел ошибку
        alert(this.error);
      }
    });
  }

  async saveChanges() {
    const table = this.selectedEntity();
    if (!table) return;

    const pk = this.getPrimaryKey();
    if (!pk) {
      console.warn('⚠️ Первичный ключ не найден');
      this.error = 'Первичный ключ для сохранения не найден.';
      return;
    }

    const changedRows = this.data.filter(row => {
      // Ищем исходную строку по PK. Если ее нет, это новая строка (которая должна быть добавлена через confirmAddRow, а не saveChanges)
      const original = this.originalData.find(r => r[pk] === row[pk]);
      return original && JSON.stringify(original) !== JSON.stringify(row);
    });

    try {
      if (changedRows.length === 0) {
        console.log('Нет изменений для сохранения.');
        return;
      }

      this.loading = true;
      for (const row of changedRows) {
        await firstValueFrom(this.updateEntityRow(table, row[pk], row));
        console.log(`✅ Обновлена строка с ${pk}=${row[pk]}`);
      }

      // После сохранения, перезагрузить данные, чтобы обновить originalData
      this.pageChange.emit(this.currentPage());
      console.log(`✅ Сохранено ${changedRows.length} строк(и)`);
    } catch (err) {
      console.error('❌ Ошибка при сохранении:', err);
      this.error = '❌ Ошибка при сохранении изменений.';
    } finally {
      this.loading = false;
    }
  }

  deleteRow(row: any) {
    const table = this.selectedEntity();
    if (!table) return;

    const pk = this.getPrimaryKey();
    if (!pk) {
      console.warn('⚠️ Первичный ключ не найден');
      this.error = 'Первичный ключ для удаления не найден.';
      return;
    }

    if (!row[pk]) {
      // Если у строки нет первичного ключа, она еще не сохранена в БД
      this.data = this.data.filter(r => r !== row);
      console.log('Несохраненная строка удалена из списка.');
      return;
    }

    this.deleteEntityRow(table, row[pk]).subscribe({
      next: () => {
        // После удаления, обновляем totalItems и перезагружаем данные на текущей странице
        this.pageChange.emit(this.currentPage());
        console.log(`✅ Удалена строка с ${pk}=${row[pk]}`);
      },
      error: (err) => {
        console.error('❌ Ошибка при удалении:', err);
        this.error = 'Ошибка при удалении строки.';
      }
    });
  }

  goToPage(page: number) {
    // Проверка на корректность номера страницы
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page); // Отправляем событие в родительский компонент
    } else {
      console.warn(`Попытка перейти на несуществующую страницу: ${page}. Всего страниц: ${this.totalPages()}`);
    }
  }
}
