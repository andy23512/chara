import { Injectable } from '@angular/core';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

@Injectable({ providedIn: 'root' })
export class LlmService {
  engine: any;

  async initEngine() {
    this.engine = await CreateWebWorkerMLCEngine(
      new Worker(new URL('../app.worker', import.meta.url)),
      'Llama-3.1-8B-Instruct-q4f32_1-MLC',
    );
  }

  async generateSentence(word: string) {
    if (!this.engine) {
      await this.initEngine();
    }
    const response = await this.engine.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Make a short, simple sentence with word "${word}"`,
        },
      ],
    });
    return response;
  }
}
