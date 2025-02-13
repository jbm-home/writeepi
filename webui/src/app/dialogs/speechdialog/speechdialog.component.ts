import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module.js';
import { TextToSpeechService } from '../../services/textToSpeech.service.js';
import { I18nService } from '../../services/i18n.service.js';

@Component({
  selector: 'app-speechdialog',
  imports: [SharedModule],
  templateUrl: './speechdialog.component.html',
  styleUrl: './speechdialog.component.scss'
})
export class SpeechdialogComponent implements OnInit {
  voices: SpeechSynthesisVoice[] = [];
  constructor(
    public dialogRef: MatDialogRef<any>,
    private tts: TextToSpeechService,
    private i18n: I18nService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
    this.tts.selectLang(this.i18n.currentLangFullData.iso);
    this.voices = this.tts.listVoices();
  }

  select(voice: string): void {
    this.tts.selectVoice(voice);
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
