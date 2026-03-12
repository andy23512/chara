import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxMessage, WebLlmService } from 'ngx-web-llm';

@Component({
  selector: 'app-llm-page',
  templateUrl: 'llm-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class LlmPageComponent {
  messages: NgxMessage[] = [];
  userInput: string = '';
  isGenerating: boolean = false;

  constructor(
    public webLlm: WebLlmService,
    public cdf: ChangeDetectorRef,
  ) {}

  sendMessage(): void {
    if (
      !this.userInput.trim() ||
      !this.webLlm.isEngineReady ||
      this.isGenerating
    )
      return;

    const userMessage: NgxMessage = { role: 'user', content: this.userInput };
    this.messages = [...this.messages, userMessage];
    const currentInput = this.userInput;
    this.userInput = '';
    this.isGenerating = true;

    let assistantResponse = '';
    const assistantMessagePlaceholder: NgxMessage = {
      role: 'assistant',
      content: '...',
    };
    this.messages = [...this.messages, assistantMessagePlaceholder];

    this.webLlm
      .streamChatDeltas({ messages: [{ role: 'user', content: currentInput }] })
      .subscribe({
        next: (deltaContent) => {
          assistantResponse += deltaContent;
          this.messages = this.messages.map((msg, index) =>
            index === this.messages.length - 1
              ? { ...msg, content: assistantResponse }
              : msg,
          );
          this.cdf.markForCheck();
        },
        error: (err) => {
          console.error('Error during chat streaming:', err);
          this.messages = this.messages.map((msg, index) =>
            index === this.messages.length - 1
              ? { ...msg, content: 'Error generating response.' }
              : msg,
          );
          this.isGenerating = false;
        },
        complete: () => {
          this.isGenerating = false;
        },
      });
  }
}
