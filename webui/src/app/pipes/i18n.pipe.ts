import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../services/i18n.service.js';

@Injectable({
  providedIn: 'root',
})
@Pipe({
  name: 'i18n',
  pure: false,
})
export class I18nPipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(key: any): any {
    return this.i18n.data[key] || key;
  }
}
