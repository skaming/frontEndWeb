import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],

  // используем template вместо: <templateUrl: './header.component.html',>
  template: `
    <header class="app-header">
      <!-- Левый блок: Лого -->
      <div class="header-left">
        <div class="logo">IBPGATE</div>
      </div>

      <div class="header-center">

        <button class="buttonLayout" routerLink="/microorm" routerLinkActive="active">Tables from MSSQL by MicroORM</button>
      </div>

      <!-- Правый блок: Иконки -->
      <div class="header-right">
        <button class="logout-btn" (click)="logout()">Logout</button>
      </div>

    </header>
  `,

  // используем styles вместо: <styleUrls: ['./header.component.scss']>
  styles: [`
    /* ВНИМАНИЕ: @use и @import здесь не работают!: <@use '../../../styles' as *;> */

    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #20232a;
      padding: 0.5rem 1rem;
      color: white;

      .header-left,
      .header-center,
      .header-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .separatorHeader {
        height: 1rem;
        width: 1px;
        background-color: #ccc;
        align-self: center;
      }

      .buttonLayout {
        color: #f8f9fa; // $white1;
        background: none;
        border: none;
        //gap: 6rem;
        padding: 0.4rem;
        cursor: pointer;
        //text-transform: uppercase;
        &:hover {
          color: #cbcccd; //$gray1;
        }
        &.active {
          text-decoration: underline;
          //font-weight: bold;
          text-decoration-color: #a4a5ab //$gray2;
        }
      }

      .logout-btn {
        background: white;
        color: black;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
      }

      .logout-btn:hover {
        background: #cccccc;
      }

      .icon {
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .icon:hover {
        background: white;
      }


    }


  `]

})
export class HeaderComponent {

  constructor(private router: Router) {}

  async logout(): Promise<void> {
    localStorage.removeItem('token');       // Удаляем токен
    await this.router.navigate(['/login']); // Перенаправляем на страницу логина
  }
}
