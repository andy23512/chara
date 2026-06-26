import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  OnInit,
  input,
  signal,
} from '@angular/core';
import colormap from 'colormap';
import { clamp } from 'ramda';
import { interval } from 'rxjs';
import { cos, sin } from 'src/app/utils/math.utils';
import { SevenSegmentComponent } from '../seven-segment/seven-segment.component';

const size = 100;
const r1 = 80;
const r2 = 95;
const sectorNumber = 45;
const gapDeg = 1;
const sectorDeg = (90 - gapDeg * (sectorNumber - 1)) / sectorNumber;
const fps = 10;
const maxDiffPerFrame = 2;

const HOT_COLOR_MAP = colormap({
  colormap: 'hot',
  nshades: 306,
});
HOT_COLOR_MAP.splice(0, 50);

@Component({
  selector: 'app-speedometer',
  standalone: true,
  imports: [SevenSegmentComponent],
  templateUrl: './speedometer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeedometerComponent implements OnInit {
  public speed = input.required<number>();
  public speedUnit = input.required<string>();
  public maxSpeed = input.required<number>();
  public displaySpeed = signal<number>(0);
  public size = size;

  sectors = Array.from({ length: sectorNumber }).map((_, i) => ({
    index: i,
    degFrom: i * (sectorDeg + gapDeg),
    degTo: i * (sectorDeg + gapDeg) + sectorDeg,
  }));

  ngOnInit(): void {
    interval(1000 / fps).subscribe(() => {
      const speed = this.speed();
      const displaySpeed = this.displaySpeed();
      const diff = speed - displaySpeed;
      this.displaySpeed.set(
        displaySpeed +
          Math.max(Math.min(diff, maxDiffPerFrame), -maxDiffPerFrame),
      );
    });
  }

  d({ degFrom, degTo }: { degFrom: number; degTo: number }) {
    const cx = size;
    const cy = size;
    return `
      M ${cx - r1 * cos(degFrom)} ${cy - r1 * sin(degFrom)}
      A ${r1} ${r1} 0 0 1 ${cx - r1 * cos(degTo)} ${cy - r1 * sin(degTo)}
      L ${cx - r2 * cos(degTo)} ${cy - r2 * sin(degTo)}
      A ${r2} ${r2} 0 0 0 ${cx - r2 * cos(degFrom)} ${cy - r2 * sin(degFrom)}
      Z
    `;
  }

  fill(index: number) {
    return this.getColorForSpeed((this.maxSpeed() / sectorNumber) * index);
  }

  opacity(index: number) {
    const displaySpeed = this.displaySpeed();
    return displaySpeed / this.maxSpeed() > (index + 1) / sectorNumber ? 1 : 0;
  }

  @HostBinding('style.color') get color() {
    const displaySpeed = this.displaySpeed();
    return this.getColorForSpeed(displaySpeed);
  }

  private getColorForSpeed(speed: number) {
    const index = clamp(
      0,
      HOT_COLOR_MAP.length - 1,
      Math.floor((speed / this.maxSpeed()) * HOT_COLOR_MAP.length),
    );
    return HOT_COLOR_MAP[index];
  }
}
