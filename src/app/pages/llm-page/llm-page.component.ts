import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { LlmService } from 'src/app/services/llm.service';

@Component({
  selector: 'app-llm-page',
  templateUrl: 'llm-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class LlmPageComponent implements OnInit {
  public llmService = inject(LlmService);

  public ngOnInit(): void {
    this.llmService.generateSentence('my').then((response) => {
      console.log(response);
    });
  }
}
