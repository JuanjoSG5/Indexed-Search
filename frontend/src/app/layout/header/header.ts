import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation';
import { MenuIcon } from '../../icons/menu-icon/menu-icon';
import { XIcon } from '../../icons/x-icon/x-icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, MenuIcon, XIcon],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private translationService = inject(TranslationService);
  isMenuOpen = false;
  currentLang = this.translationService.currentLang;
  currentYear: number = new Date().getFullYear();
  navData = computed(() => this.translationService.content()?.common.nav);
  
  constructor() {
    // 2. The Effect lives HERE now.
    // Whenever the language changes (signal updates), this runs automatically.
    effect(() => {
      const data = this.navData(); // Get the nav section
      
    });
  }
  
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  toggleLanguage(): void {
    this.translationService.toggleLang();
  }
}