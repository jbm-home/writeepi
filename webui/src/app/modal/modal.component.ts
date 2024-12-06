import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModaleComponent {
	activeModal = inject(NgbActiveModal);
	@Input() name!: string;
	@Input() extraMessage!: string;
	@Input() inputTitle!: string;
  @Input() inputContent: string = '';
  @Input() confirmLabel!: string;
}
