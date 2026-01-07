import { Component, input, output } from '@angular/core';
import { SearchIcon } from '../../icons/search-icon/search-icon';

@Component({
  selector: 'example-item',
  imports: [SearchIcon],
  templateUrl: './example-item.html',
  styleUrl: './example-item.css',
})
export class ExampleItem {
  label = input.required<string>();
  itemClick = output<string>();

  onClick() {
    this.itemClick.emit(this.label());
  }
}