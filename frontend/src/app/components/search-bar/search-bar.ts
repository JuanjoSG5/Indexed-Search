import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExampleItem } from '../example-item/example-item';
import { SearchIcon } from '../../icons/search-icon/search-icon';

@Component({
  selector: 'search-bar',
  imports: [FormsModule, ExampleItem, SearchIcon],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css'],
})
export class SearchBar {
  query = signal(''); 
  
  search = output<string>();
  placeholder = input('Search for products...');
  searchExamples = [
    "bluetooth",
    "bluetooth noise cancelling", 
    "black cable",
  ];

  onClickExample(example: string) {
    this.query.set(example);
    this.triggerSearch();
  }
  
  triggerSearch() {
    if (this.query().trim()) {
       // Send text to parent component
      this.search.emit(this.query());
    }
  }
}