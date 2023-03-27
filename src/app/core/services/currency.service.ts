import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ICurrency } from '../interfaces/currency';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private baseUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) { }

  public getCurrencies() {
    return this.http.get<ICurrency[]>(this.baseUrl + "api/Currency/v1");
  }
}
