import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IExchangeRate } from '../interfaces/exchange-rate';

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private baseUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) { }

  public getExchangeRate(currencyCode: string, dateTime: Date) {
    return this.http.get<IExchangeRate>(this.baseUrl + "api/ExchangeRate/v1/" + currencyCode + '/' + dateTime.toJSON());
  }
}
