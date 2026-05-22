import { Pipe, PipeTransform } from '@angular/core';
import { toFirstCap } from '../utils/case.utils';

@Pipe({
  name: 'sentenceCase',
  standalone: true,
})
export class SentenceCasePipe implements PipeTransform {
  transform(value: string): string {
    return toFirstCap(value);
  }
}
