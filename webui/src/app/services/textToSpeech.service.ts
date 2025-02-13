import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class TextToSpeechService {
    selectedLang = 'en-US';
    selectedVoice = 'Google US English';
    isoLang = /^[a-z]{2}-[A-Z]{2}$/u;

    selectLang(lang: string) {
        if (lang.match(this.isoLang)) {
            this.selectedLang = lang;
            return true
        }
        return false;
    }

    listVoices() {
        if (this.selectedLang.match(this.isoLang)) {
            return speechSynthesis.getVoices().filter((voice) => voice.lang === this.selectedLang);
        } else {
            return [];
        }
    }

    listAllVoices() {
        return speechSynthesis.getVoices();
    }

    selectVoice(voice: string) {
        this.selectedVoice = voice;
    }

    isSpeaking() {
        return speechSynthesis.speaking;
    }

    start(text: string, rate = 1) {
        const textToSpeech = new SpeechSynthesisUtterance(text);
        textToSpeech.lang = this.selectedLang;
        textToSpeech.text = text;
        textToSpeech.rate = rate;

        const voice = speechSynthesis.getVoices().filter((voice) => voice.name === this.selectedVoice)[0];
        textToSpeech.voice = voice;

        speechSynthesis.speak(textToSpeech);
    }

    stop() {
        speechSynthesis.cancel();
    }
}