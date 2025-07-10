import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HeaderComponent} from './header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent
  ],

  // используем template вместо: <  templateUrl: './layout.component.html',>
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
  `,

  // используем styles вместо: <  styleUrls: ['./layout.component.scss']>
  styles: [`
  `]

})

export class LayoutComponent {}
