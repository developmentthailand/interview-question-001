import { Component } from '@angular/core';
import { PersonDirectory } from './person-directory/person-directory';

@Component({
  imports: [PersonDirectory],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
