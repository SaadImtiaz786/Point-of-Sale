import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: []
})
export class AppComponent {
  constructor(private router: Router) {}

  get isPosPage() {
    return this.router.url === '/';
  }

  toggleAddProduct() {
    // Use a custom event to notify PosComponent
    window.dispatchEvent(new CustomEvent('toggle-add-product'));
  }
}
