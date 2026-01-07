import { Component, computed, inject } from '@angular/core';
import { TranslationService } from '../../services/translation';
import { GithubIcon } from '../../icons/github-icon/github-icon';
import { LinkedinIcon } from '../../icons/linkedin-icon/linkedin-icon';



@Component({
  selector: 'app-footer',
  imports: [GithubIcon, LinkedinIcon],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  private translationService = inject(TranslationService);

  currentYear: number = new Date().getFullYear();

  footerData = computed(() => this.translationService.content()?.common.footer);
  
}
