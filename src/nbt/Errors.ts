export class EndOfStreamError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "EndOfStreamError";
    }
}

export class InvalidReaderStateError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "InvalidReaderStateError";
    }
}

export class NbtFormatError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "NbtFormatError";
    }
}
