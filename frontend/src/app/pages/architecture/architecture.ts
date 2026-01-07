import { Component, computed, effect, inject } from '@angular/core';
import { TranslationService } from '../../services/translation';
import { Meta, Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-architecture',
  imports: [CommonModule],
  templateUrl: './architecture.html',
  styleUrl: './architecture.css',
})
export class Architecture {
  showToast = false;
  private toastTimeout: any;

  private readonly translationService = inject(TranslationService);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  protected readonly currentLang = this.translationService.currentLang;
  protected readonly architectureData = computed(() => 
    this.translationService.content()?.architecture
  );

  constructor() {
    effect(() => {
      const data = this.architectureData();
      if (data?.meta) {
        this.title.setTitle(data.meta.title);
        this.meta.updateTag({ name: 'description', content: data.meta.description });
      }
    });
  }

  
  

  copyEmail() {
    // Get email from your data signal (or hardcode it if easier)
    const email = this.architectureData()?.authorAndContact.cta.email || 'juanshzglez55@gmail.com';

    navigator.clipboard.writeText(email).then(() => {
      if (this.toastTimeout) clearTimeout(this.toastTimeout);

      // Show toast
      this.showToast = true;

      this.toastTimeout = setTimeout(() => {
        this.showToast = false;
      }, 3000);
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  }
}