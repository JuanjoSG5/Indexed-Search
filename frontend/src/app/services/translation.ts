import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { firstValueFrom, filter } from 'rxjs';
import { AppContent } from '../models/content';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentLang = signal<'en' | 'es'>('en');
  content = signal<AppContent | null>(null);
  isLoading = signal(true);

  constructor() {
    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const lang = this.getLangFromUrl();
        if (lang && lang !== this.currentLang()) {
          this.loadTranslations(lang);
        }
      });

    // Load initial language from URL
    const initialLang = this.getLangFromUrl();
    this.loadTranslations(initialLang);
  }

  private getLangFromUrl(): 'en' | 'es' {
    const urlSegments = this.router.url.split('/');
    const lang = urlSegments[1];
    return (lang === 'en' || lang === 'es') ? lang : 'en';
  }

  async loadTranslations(lang: 'en' | 'es') {
    this.isLoading.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<AppContent>(`assets/i18n/${lang}.json`)
      );
      
      this.content.set(data);
      this.currentLang.set(lang);
    } catch (error) {
      console.error('Failed to load translations', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleLang() {
    const newLang = this.currentLang() === 'en' ? 'es' : 'en';
    const currentUrl = this.router.url;
    const urlWithoutLang = currentUrl.replace(/^\/(en|es)/, '');
    this.router.navigate([`/${newLang}${urlWithoutLang}`]);
  }
}