import { Component, computed, effect, inject } from '@angular/core';
import { TranslationService } from '../../services/translation';
import { Meta, Title } from '@angular/platform-browser';
import { SearchService } from '../../services/search';
import { SearchBar } from '../../components/search-bar/search-bar';
import { CommonModule } from '@angular/common';
import { SearchCard } from '../../components/search-card/search-card';

@Component({
  selector: 'app-home',
  imports: [CommonModule, SearchBar, SearchCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private t = inject(TranslationService);
  private title = inject(Title);
  private meta = inject(Meta);

  homeData = computed(() => this.t.content()?.home);
  searchData = inject(SearchService);
  searchExamples = [
    "red",
    'wireless headphones',
    "black running shoes",
  ]
    
  constructor() {
    effect(() => {
      const data = this.homeData(); 
      
      if (data) {
        this.title.setTitle(data.meta.title);
        this.meta.updateTag({ name: 'description', content: data.meta.description });
      }
    });
  }

  onSearch(query: string) {
    this.searchData.search(query);
  }
  
}