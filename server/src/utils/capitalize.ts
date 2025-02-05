export class Capitalize {
    static from(word: string) {
        word = word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
    }
}