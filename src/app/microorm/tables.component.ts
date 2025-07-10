// src/app/microorm/tables.component.ts
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs'; // Make sure 'tap' is imported
import { TableslistComponent } from './tableslist.component';
import { TablesdataComponent } from './tablesdata.component';

// Make sure this interface is exported
export interface PaginatedResponse<T> {
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, TableslistComponent, TablesdataComponent],
  template: `
    <div class="tables-container">
      <app-tableslist
        [selectedEntity]="selectedEntity"
        [getEntityNames]="getEntityNames" />

      <app-tablesdata
        [selectedEntity]="selectedEntity"
        [getEntityData]="getEntityData"
        [createEntityRow]="createEntityRow"
        [updateEntityRow]="updateEntityRow"
        [deleteEntityRow]="deleteEntityRow"
        [getEntityMetadata]="getEntityMetadata"
        [currentPage]="currentPage"             [itemsPerPage]="itemsPerPage"           [totalItems]="totalItems"               (pageChange)="onPageChange($event)" />
    </div>
  `,
  styles: [`
    .tables-container {
      display: flex;
      flex-direction: row;
      height: calc(100vh - 3rem);
      width: 100%;
      margin: 0;
    }
    app-tableslist {
      width: 20%;
      min-width: 240px;
      max-width: 320px;
      height: 100%;
      background-color: #cbcccd;
      padding: 2rem 1rem;
      box-sizing: border-box;
      overflow-y: auto;
    }
    app-tablesdata {
      flex: 1;
      height: 100%;
      background-color: #ffffff;
      padding: 2rem;
      box-sizing: border-box;
      overflow-y: auto;
    }
  `]
})
export class TablesComponent {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  selectedEntity: WritableSignal<string | null> = signal<string | null>(null);

  currentPage: WritableSignal<number> = signal(1);
  itemsPerPage: WritableSignal<number> = signal(10);
  totalItems: WritableSignal<number> = signal(0);

  getEntityNames = (): Observable<string[]> =>
    this.http.get<string[]>(`${this.apiUrl}/tables`);

  // Corrected type signature for getEntityData to match TablesdataComponent's expectation
  // It now clearly expects tableName, limit, and offset, and returns a PaginatedResponse.
  getEntityData = (tableName: string, limit: number, offset: number): Observable<PaginatedResponse<any>> => {
    let params = new HttpParams();
    params = params.append('limit', limit.toString());
    params = params.append('offset', offset.toString());
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/tables/${tableName}`, { params }).pipe(
      tap(response => {
        this.totalItems.set(response.totalCount);
      })
    );
  }

  onPageChange(newPage: number) {
    this.currentPage.set(newPage);
    // When the page changes, reset totalItems to 0 if the selected entity changes
    // to ensure correct pagination calculation for the new table.
    // This part might be better handled in the effect in TablesdataComponent if it resets totalItems before loading new data.
    // However, for explicit control, you could re-trigger loadData logic if needed.
  }

  createEntityRow = (tableName: string, row: any): Observable<any> =>
    this.http.post(`${this.apiUrl}/tables/${tableName}`, row);

  getEntityMetadata = (tableName: string): Observable<any[]> =>
    this.http.get<any[]>(`${this.apiUrl}/tables/${tableName}/metadata`);

  updateEntityRow = (tableName: string, id: string | number, row: any): Observable<any> => // Corrected ID type
    this.http.put(`${this.apiUrl}/tables/${tableName}/${id}`, row);

  deleteEntityRow = (tableName: string, id: string | number): Observable<any> => // Corrected ID type
    this.http.delete(`${this.apiUrl}/tables/${tableName}/${id}`);
}
