import { v7 as uuidv7 } from 'uuid';
import { validate as uuidvalidate } from 'uuid';

export class UuidUtils {
    static isValidUuid(input: string): boolean {
        return input !== undefined && uuidvalidate(input);
    }

    static v7(): string {
        return uuidv7();
    }
}