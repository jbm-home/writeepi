export class uuidv7Builder {
    static readonly UNIX_TS_MS_BITS = 48;
    static readonly VER_DIGIT = "7";
    static readonly SEQ_BITS = 12;
    static readonly VAR = 0b10;
    static readonly VAR_BITS = 2;
    static readonly RAND_BITS = 62;

    static builder(
        getRandomValues: (array: Uint32Array) => Uint32Array,
    ) {
        let prevTimestamp = -1;
        let seq = 0;

        return () => {
            // Negative system clock adjustments are ignored to keep monotonicity
            const timestamp = Math.max(Date.now(), prevTimestamp);
            seq = timestamp === prevTimestamp ? seq + 1 : 0;
            prevTimestamp = timestamp;

            const var_rand = new Uint32Array(2);
            getRandomValues(var_rand);
            var_rand[0] = (this.VAR << (32 - this.VAR_BITS)) | (var_rand[0]! >>> this.VAR_BITS);

            const digits =
                timestamp.toString(16).padStart(this.UNIX_TS_MS_BITS / 4, "0") +
                this.VER_DIGIT +
                seq.toString(16).padStart(this.SEQ_BITS / 4, "0") +
                var_rand[0]!.toString(16).padStart((this.VAR_BITS + this.RAND_BITS) / 2 / 4, "0") +
                var_rand[1]!.toString(16).padStart((this.VAR_BITS + this.RAND_BITS) / 2 / 4, "0");

            return (
                digits.slice(0, 8) +
                "-" +
                digits.slice(8, 12) +
                "-" +
                digits.slice(12, 16) +
                "-" +
                digits.slice(16, 20) +
                "-" +
                digits.slice(20)
            );
        };
    }
}

export const uuidv7 = uuidv7Builder.builder((array) => crypto.getRandomValues(array));
