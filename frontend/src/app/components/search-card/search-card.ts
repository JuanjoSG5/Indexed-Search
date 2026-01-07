import { Component, input } from '@angular/core';
import { SearchItem } from '../../models/search-results';

@Component({
  selector: 'search-card',
  imports: [],
  templateUrl: './search-card.html',
  styleUrl: './search-card.css',
})
export class SearchCard {
  product = input<SearchItem>();
}
