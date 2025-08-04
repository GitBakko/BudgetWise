import { Injectable } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

/**
 * Servizio per implementare debounce nelle ricerche
 * Evita chiamate API eccessive durante la digitazione
 */
@Injectable({
  providedIn: 'root'
})
export class DebounceService {
  private searchSubject = new Subject<string>();
  
  /**
   * Crea un observable con debounce per la ricerca
   */
  createDebouncedSearch<T>(
    searchFn: (term: string) => Promise<T>,
    debounceMs: number = 500
  ) {
    return this.searchSubject.pipe(
      debounceTime(debounceMs),
      distinctUntilChanged(),
      switchMap(searchTerm => 
        searchTerm.length >= 2 ? 
          Promise.resolve(searchFn(searchTerm)) : 
          Promise.resolve(null)
      )
    );
  }

  /**
   * Triggera una nuova ricerca
   */
  search(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * Reset del servizio
   */
  reset(): void {
    this.searchSubject.next('');
  }
}
