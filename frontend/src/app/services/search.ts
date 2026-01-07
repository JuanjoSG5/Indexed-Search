import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { SearchResults } from '../models/search-results';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  // Signals are great, keep them!
  private results = signal<SearchResults>({
     meta: { total: '0', perf: { total: '0ms', algo: '0ms', db: '0ms' }, query: '' }, 
     data: [] 
  });
  isLoading = signal<boolean>(false);

  getResults = computed(() => this.results());
  getMetadata = computed(() => this.results().meta);

  // Inject HttpClient
  constructor(private http: HttpClient) {}

  search(query: string) {
    if (!query.trim()) return;

    console.log('Starting search for query:', query);
    this.isLoading.set(true);
    
    // 1. Get the URL correctly from the environment file
    const url = `${environment.apiUrl}/search?q=${encodeURIComponent(query)}`;
    console.log('Constructed search URL:', url);
    
    // 2. Use HttpClient (It returns an Observable)
    this.http.get<SearchResults>(url).subscribe({
      next: (data) => {
        console.log('Search results:', data);
        this.results.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.isLoading.set(false);
      }
    });
  }
}