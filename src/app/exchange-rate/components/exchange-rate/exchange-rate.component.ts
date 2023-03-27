import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ICurrency } from 'src/app/core/interfaces/currency';
import { CurrencyService } from 'src/app/core/services/currency.service';
import { ExchangeRateService } from 'src/app/core/services/exchange-rate.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'app-exchange-rate',
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.less']
})
export class ExchangeRateComponent implements OnInit {
  private defaultValue = 'EUR';
  private exchangeRate = 1;

  today = new Date();
  minDate = new Date(1991, 0, 3);

  isLoading = false;

  currencyFormGroup = this.fb.group({
    korunaCode: 'CZK',
    currencyCode: '',
    czkValue: [0, [Validators.min(0), Validators.max(1000000000000)]],
    otherValue: [0, [Validators.min(0), Validators.max(1000000000000)]],
    date: this.today 
  });

  currenciesList: ICurrency[] = [];
  filteredCurrenciesList: ICurrency[] = [];

  constructor(
    private fb: FormBuilder,
    private currencyService: CurrencyService,
    private exchangeRateService: ExchangeRateService,
    private toastr: ToastrService 
    ) {
      this.today.setHours(0, 0, 0, 0);
    }

  ngOnInit(): void {
    this.initializeCurrencyList();
    this.initializeFormSubscribers();
  }

  private initializeCurrencyList(){
    this.currencyService.getCurrencies().subscribe((currencies) => {
      currencies.forEach(c => {
        c.maxDate = new Date(c.maxDate);
        c.minDate = new Date(c.minDate);
      })
      this.currenciesList = currencies;

      this.filterCurrencies();
      
      this.currencyFormGroup.patchValue({
        currencyCode: this.defaultValue
      });
    });
  }

  private updateExchangeRate() {
    this.isLoading = true;
    let currencyCode = this.currencyFormGroup.controls.currencyCode.value;
    let date = this.currencyFormGroup.controls.date.value;
    if(!currencyCode || !date) {
      return;
    }

    date = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

    this.exchangeRateService
      .getExchangeRate(currencyCode, date)
      .subscribe(r => {
        this.exchangeRate = r.rate;

        this.currencyFormGroup.patchValue({
          otherValue: 1
        });
        this.isLoading = false;
      }, (e) => {
        this.toastr.error(e.error[0]);
        this.isLoading = false;
      });
  }

  private initializeFormSubscribers(){
    this.currencyFormGroup.controls.czkValue.valueChanges
      .pipe(
        untilDestroyed(this)
      )
      .subscribe(x => {
        if(x !== null) {
          this.currencyFormGroup.patchValue({
            otherValue: Math.floor((x / this.exchangeRate) * 10000) / 10000
          }, { emitEvent: false });
        }
      });

    this.currencyFormGroup.controls.otherValue.valueChanges
      .pipe(
        untilDestroyed(this)
      )  
      .subscribe(x => {
        if(x !== null) {
          this.currencyFormGroup.patchValue({
            czkValue: Math.floor((x * this.exchangeRate) * 10000) / 10000
          }, { emitEvent: false });
        }
      });

    this.currencyFormGroup.controls.currencyCode.valueChanges
      .pipe(
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.updateExchangeRate();
      });

    this.currencyFormGroup.controls.date.valueChanges
      .pipe(
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.filterCurrencies()

        let currencyCode = this.currencyFormGroup.controls.currencyCode.value;
        if(!this.filteredCurrenciesList.find(c => c.code === currencyCode)) {
          this.toastr.info(`No ${currencyCode} Exchange Rate for specified date`, "", {
            timeOut: 5000,
          });
          this.currencyFormGroup.patchValue({
            czkValue: 0,
            otherValue: 0
          });
        } 
        else {
          this.updateExchangeRate(); 
        }
      });
  }

  private filterCurrencies() {
    if(this.currencyFormGroup.controls.date.value !== null) {
      let date = this.currencyFormGroup.controls.date.value;
      this.filteredCurrenciesList = this.currenciesList.filter(c => c.maxDate >= date && c.minDate <= date);
    }
  }
}
