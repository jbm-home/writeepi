import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../shared.module.js';

@Component({
  selector: 'app-modal',
  imports: [SharedModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModaleComponent {
  activeModal = inject(NgbActiveModal);
  @Input() name!: string;
  @Input() extraMessage!: string;
  @Input() inputTitle!: string;
  @Input() inputContent: string = '';
  @Input() confirmLabel!: string;
}
