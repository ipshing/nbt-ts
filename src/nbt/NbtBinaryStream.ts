import { constants } from "buffer";
import { NbtTagType } from "./Enums";
import { EndOfStreamError } from "./Errors";

/**
 * A seekable stream that allows reading and writing primitive data types
 * as binary values while handling endianness and encoding.
 */
export class NbtBinaryStream {
    #bigEndian: boolean; // Whether the data in this stream is encoded in big-endian format
    #buffer: Buffer; // Either allocated internally or externally
    #capacity: number; // Length of the usable portion of #buffer for the stream
    #expandable: boolean; // User-provided buffers aren't expandable
    #length: number; // Number of bytes within the stream
    #origin: number; // For user-provided arrays, start at this origin
    #position: number; // read/write head

    /**
     * Creates an `NbtBinaryStream` with an expandable capacity.
     */
    constructor();
    /**
     * Creates an `NbtBinaryStream` with an expandable capacity initialized as specified.
     *
     * @param capacity The initial size of the internal `Buffer` in bytes.
     * @throws {RangeError} Thrown if `capacity` is negative or not an integer.
     */
    constructor(capacity: number);
    /**
     * Creates an `NbtBinaryStream` with an expandable capacity using
     * the given endian encoding.
     * @param bigEndian Whether the data is encoded in big-endian format.
     */
    constructor(bigEndian: boolean);
    /**
     * Creates an `NbtBinaryStream` with an expandable capacity initialized as specified
     * and using the given endian encoding.
     * @param capacity The initial size of the internal `Buffer` in bytes.
     * @param bigEndian Whether the data is encoded in big-endian format.
     * @throws {RangeError} Thrown if `capacity` is negative or not an integer.
     */
    constructor(capacity: number, bigEndian: boolean);
    constructor(capacityOrEndian?: number | boolean, bigEndian = true) {
        let capacity = 0;
        if (typeof capacityOrEndian === "number") {
            capacity = capacityOrEndian;
        } else if (typeof capacityOrEndian === "boolean") {
            bigEndian = capacityOrEndian;
        }
        // Validate
        if (!Number.isSafeInteger(capacity) || capacity < 0 || capacity > constants.MAX_LENGTH) {
            throw new RangeError(`capacity must be a non-negative integer less than ${constants.MAX_LENGTH}`);
        }

        // Create an empty Buffer of size capacity
        this.#buffer = Buffer.alloc(capacity);
        this.#capacity = capacity;
        this.#bigEndian = bigEndian;
        this.#expandable = true;
        this.#length = 0;
        this.#origin = 0;
        this.#position = 0;
    }

    /**
     * Creates a non-resizable `NbtBinaryStream` connected to the specified `Buffer`.
     * Assumes the data to be encoded in big-endian format.
     *
     * @param buffer The `Buffer` from which to create this instance.
     */
    public static from(buffer: Buffer): NbtBinaryStream;
    /**
     * Creates a non-resizable `NbtBinaryStream` connected to
     * the specified `Buffer` using the given endian encoding.
     *
     * @param buffer The `Buffer` from which to create this instance.
     * @param bigEndian Whether the data is encoded in big-endian format.
     */
    public static from(buffer: Buffer, bigEndian: boolean): NbtBinaryStream;
    /**
     * Creates a non-resizable `NbtBinaryStream` connected to
     * the specified region of the given `Buffer` using the
     * given endian encoding.
     *
     * @param buffer The `Buffer` from which to create this instance.
     * @param index The index into `buffer` at which the data begins.
     * @param count The length of the buffer in bytes.
     * @param bigEndian Whether the data is encoded in big-endian format.
     *
     * @throws {RangeError} Thrown if index or count are negative or not integers.
     */
    public static from(buffer: Buffer, index: number, count: number, bigEndian: boolean): NbtBinaryStream;
    public static from(buffer: Buffer, indexOrEndian?: number | boolean, count?: number, bigEndian?: boolean): NbtBinaryStream {
        // Validate parameters
        let index = 0;
        if (typeof indexOrEndian === "number") {
            index = indexOrEndian;
        } else if (typeof indexOrEndian === "boolean") {
            bigEndian = indexOrEndian;
        }
        if (count === undefined) {
            count = buffer.length;
        }
        if (bigEndian === undefined) {
            bigEndian = true;
        }
        if (!Number.isSafeInteger(index) || index < 0) {
            throw new RangeError("index must be a non-negative integer");
        }
        if (!Number.isSafeInteger(count) || count < 0) {
            throw new RangeError("count must be a non-negative integer");
        }
        if (buffer.length - index < count) {
            throw new RangeError(
                "Offset and length were out of bounds for the buffer or count is greater than the number of elements from index to the end of the source collection."
            );
        }

        const nbtBinaryStream = new NbtBinaryStream();
        nbtBinaryStream.#buffer = buffer;
        nbtBinaryStream.#bigEndian = bigEndian;
        nbtBinaryStream.#capacity = index + count;
        nbtBinaryStream.#expandable = false;
        nbtBinaryStream.#length = index + count;
        nbtBinaryStream.#origin = index;
        nbtBinaryStream.#position = index;

        return nbtBinaryStream;
    }

    /**
     * Gets all data written to this `NbtBinaryStream`.
     */
    public get buffer(): Buffer {
        return this.#buffer.subarray(this.#origin, this.#position);
    }

    /**
     * Gets or sets the number of bytes allocated for this `NbtBinaryStream`.
     * The capacity cannot be set to a value less than the current length
     * of the buffer.
     */
    public get capacity(): number {
        return this.#capacity - this.#origin;
    }
    public set capacity(value: number) {
        // Only update the capacity if the buffer is expandable and
        // the value is different than the current capacity.
        // Special behavior if the buffer isn't expandable: don't throw
        // and error if the value is the same as the current capacity.

        if (!Number.isSafeInteger(value) || value < 0) {
            throw new RangeError("value must be a non-negative integer");
        }
        if (value < this.length) {
            throw new RangeError("Capacity cannot be less than the current size.");
        }
        if (!this.#expandable && value != this.capacity) {
            throw new Error("Buffer is not expandable.");
        }

        if (this.#expandable && value != this.#capacity) {
            if (value > 0) {
                const newBuffer = Buffer.alloc(value);
                if (this.#length > 0) {
                    this.#buffer.copy(newBuffer, 0, 0, this.#length);
                }
                this.#buffer = newBuffer;
            } else {
                this.#buffer = Buffer.alloc(0);
            }
            this.#capacity = value;
        }
    }

    /**
     * Gets or sets the length of the `NbtBinaryStream` in bytes.
     */
    public get length(): number {
        return this.#length - this.#origin;
    }
    public set length(value: number) {
        if (!Number.isSafeInteger(value) || value < 0 || value > constants.MAX_LENGTH) {
            throw new RangeError(`value must be a non-negative integer less than ${constants.MAX_LENGTH} - origin.`);
        }
        const newLength = this.#origin + value;
        this.#ensureCapacity(newLength);
        this.#length = newLength;
        if (this.#position > newLength) {
            this.#position = newLength;
        }
    }

    /**
     * Gets or sets the current position within the `NbtBinaryStream`;
     *
     * @throws {RangeError} Thrown if the position is set to a negative
     * value or a value greather than a 32-bit integer max value.
     */
    public get position(): number {
        return this.#position - this.#origin;
    }
    public set position(value: number) {
        if (!Number.isSafeInteger(value) || value < 0 || value > constants.MAX_LENGTH) {
            throw new RangeError(`value must be a non-negative integer less than ${constants.MAX_LENGTH} - origin.`);
        }
        this.#position = this.#origin + value;
    }

    /**
     * Sets the position within the current `NbtBinaryStream` to the specified value.
     *
     * @param offset The new position within the buffer. This is relative to
     * the `origin` paramater and can be positive or negative.
     * @param origin A value of type `SeekOrigin`, which acts as the seek reference point.
     *
     * @returns The new position within the buffer, calculated by combining the initial
     * reference point and the offset.
     *
     * @throws {RangeError} Thrown if `offset` is greater than the maximum allowed size of a buffer.
     * @throws {Error} Thrown if seeking is attempted before the beginning of the buffer.
     */
    public seek(offset: number, origin: SeekOrigin): number {
        if (!Number.isSafeInteger(offset) || offset > constants.MAX_LENGTH) {
            throw new RangeError("offset must be an integer value less than the maximum size of the buffer.");
        }
        switch (origin) {
            case SeekOrigin.Begin: {
                const tempPosition = this.#origin + offset;
                if (offset < 0 || tempPosition < this.#origin) {
                    throw new Error("Cannot seek to before the beginning of the buffer.");
                }
                this.#position = tempPosition;
                break;
            }
            case SeekOrigin.Current: {
                const tempPosition = this.#position + offset;
                if (tempPosition < this.#origin) {
                    throw new Error("Cannot seek to before the beginning of the buffer.");
                }
                this.#position = tempPosition;
                break;
            }
            case SeekOrigin.End: {
                const tempPosition = this.#length + offset;
                if (tempPosition < this.#origin) {
                    throw new Error("Cannot seek to before the beginning of the buffer.");
                }
                this.#position = tempPosition;
                break;
            }
            default:
                throw new Error("Invalid seek origin");
        }

        return this.#position;
    }

    //
    // READ METHODS
    //

    /**
     * Reads an `NbtTagType` from the stream.
     * @returns The `NbtTagType` that was read.
     * @throws {EndOfStreamError} Thrown if there are not enough bytes in the buffer to read.
     * @throws {RangeError} Thrown if the value read is not a valid `NbtTagType`.
     */
    public readTagType(): NbtTagType {
        const type = this.readByte();
        if (type < 0) {
            throw new EndOfStreamError();
        }
        if (type > NbtTagType.LongArray) {
            throw new RangeError(`NBT tag type out of range: ${type}`);
        }
        return type as NbtTagType;
    }

    /**
     * Reads a signed byte from the stream and advances the current position
     * of the stream by one byte.
     * @returns The next byte from the stream.
     * @throws {EndOfStreamError} Thrown if the end of the stream is reached.
     */
    public readByte(): number {
        if (this.#position >= this.#length) {
            throw new EndOfStreamError();
        }
        // Get the value and move the position
        return this.#buffer.readInt8(this.#position++);
    }

    /**
     * Reads the specified number of bytes from the stream into an `Int8Array`
     * and advances the current position of the stream by that number of bytes.
     *
     * @param count The number of bytes to read. This value must be a non-negative
     * integer or an error will be thrown.
     *
     * @returns A byte array containing the data read from the stream. This might be
     * less than the number of bytes requested if the end of the stream is reached.
     *
     * @throws {RangeError} Thrown if `count` is not 0 or an integer greater than 0.
     */
    public readBytes(count: number): number[] {
        if (!Number.isSafeInteger(count) || count < 0) {
            throw new RangeError("count must be a non-negative integer");
        }

        // Adjust count if there aren't enough bytes left in #buffer
        if (this.#length - this.#position < count) {
            count = this.#length - this.#position;
        }

        // Simply return an empty array if count is 0
        if (count === 0) return [];

        // Read bytes into array
        const result: number[] = [];
        for (let i = 0; i < count; i++) {
            result.push(this.readByte());
        }

        return result;
    }

    /**
     * Reads a 2-byte signed integer from the stream and advances
     * the current position of the stream by two bytes.
     * @returns A 2-byte signed integer read from the stream.
     * @throws {EndOfStreamError} Thrown if the end of the stream is reached.
     */
    public readInt16(): number {
        if (this.#length - this.#position < 2) {
            throw new EndOfStreamError();
        }
        // Get the value
        let value: number;
        if (this.#bigEndian) {
            value = this.#buffer.readInt16BE(this.#position);
        } else {
            value = this.#buffer.readInt16LE(this.#position);
        }
        // Move the position
        this.#position += 2;

        return value;
    }

    /**
     * Reads a 4-byte signed integer from the stream and advances
     * the current position of the stream by four bytes.
     * @returns A 4-byte signed integer read from the stream.
     * @throws {EndOfStreamError} Thrown if the end of the stream is reached.
     */
    public readInt32(): number {
        if (this.#length - this.#position < 4) {
            throw new EndOfStreamError();
        }
        // Get the value
        let value: number;
        if (this.#bigEndian) {
            value = this.#buffer.readInt32BE(this.#position);
        } else {
            value = this.#buffer.readInt32LE(this.#position);
        }
        // Move the position
        this.#position += 4;

        return value;
    }

    /**
     * Reads an 8-byte signed integer from the stream and advances
     * the current position of the stream by eight bytes.
     * @returns An 8-byte signed integer read from the stream.
     * @throws {EndOfStreamError} Thrown if the end of the stream is reached.
     */
    public readInt64(): bigint {
        if (this.#length - this.#position < 8) {
            throw new EndOfStreamError();
        }
        // Get the value
        let value: bigint;
        if (this.#bigEndian) {
            value = this.#buffer.readBigInt64BE(this.#position);
        } else {
            value = this.#buffer.readBigInt64LE(this.#position);
        }
        // Move the position
        this.#position += 8;

        return value;
    }

    /**
     * Reads a 4-byte floating-point value from the stream and advances
     * the current position of the stream by four bytes.
     * @returns A 4-byte floating-point value read from the stream.
     * @throws {EndOfStreamError} Thrown if the end of the stream is reached.
     */
    public readFloat(): number {
        if (this.#length - this.#position < 4) {
            throw new EndOfStreamError();
        }
        // Get the value
        let value: number;
        if (this.#bigEndian) {
            value = this.#buffer.readFloatBE(this.#position);
        } else {
            value = this.#buffer.readFloatLE(this.#position);
        }
        // Move the position
        this.#position += 4;

        return value;
    }

    /**
     * Reads an 8-byte floating-point value from the stream and advances
     * the current position of the stream by eight bytes.
     * @returns An 8-byte floating-point value read from the stream.
     * @throws {EndOfStreamError} Thrown if the end of the stream is reached.
     */
    public readDouble(): number {
        if (this.#length - this.#position < 8) {
            throw new EndOfStreamError();
        }
        // Get the value
        let value: number;
        if (this.#bigEndian) {
            value = this.#buffer.readDoubleBE(this.#position);
        } else {
            value = this.#buffer.readDoubleLE(this.#position);
        }
        // Move the position
        this.#position += 8;

        return value;
    }

    /**
     * Reads a string, prefixed with the length, from the stream.
     * @returns The string that was read.
     * @throws {EndOfStreamError} Thrown if the end of the stream is reached.
     */
    public readString(): string {
        if (this.#length - this.#position < 2) {
            throw new EndOfStreamError();
        }
        // Get length of string
        let length: number;
        if (this.#bigEndian) {
            length = this.#buffer.readUInt16BE(this.#position);
        } else {
            length = this.#buffer.readUInt16LE(this.#position);
        }
        // Move the position forward 2 bytes
        this.#position += 2;
        // Get string
        const string = this.#buffer.toString("utf-8", this.#position, this.#position + length);
        // Move the position forward 'length' bytes
        this.#position += length;

        return string;
    }

    /**
     * Moves the position of the stream forward by the specified amount.
     * @param bytesToSkip The number of bytes to skip.
     */
    public skip(bytesToSkip: number): void {
        if (!Number.isSafeInteger(bytesToSkip) || bytesToSkip < 0) {
            throw new RangeError("bytesToSkip must be a non-negative integer");
        }
        this.#position += bytesToSkip;
    }

    /**
     * Moves the position of the stream past the current string.
     */
    public skipString(): void {
        const length = this.readInt16();
        if (length < 0) {
            throw new Error("Negative string length given!");
        }
        this.skip(length);
    }

    //
    // WRITE METHODS
    //

    /**
     * Writes an `NbtTagType` to the stream and
     * advances the stream position by one byte.
     * @param value The `NbtTagType` to write.
     *
     * @throws {EndOfStreamError} Thrown if there is not enough room in the stream to write the `value`.
     */
    public writeTagType(value: NbtTagType): void {
        this.#enforceConstraints(1);
        // Write value
        this.#position = this.#buffer.writeInt8(value.valueOf(), this.#position);
    }

    /**
     * Writes a signed byte to the stream and
     * advances the stream position by one byte.
     *
     * @param value The byte to add to the buffer.
     *
     * @throws {EndOfStreamError} Thrown if there is not enough room in the stream to write the `value`.
     */
    public writeByte(value: number): void {
        if (!Number.isSafeInteger(value)) throw new Error("value must be an integer");
        this.#enforceConstraints(1);
        // Write value
        this.#position = this.#buffer.writeInt8(value, this.#position);
    }

    /**
     * Writes a 2-byte signed integer to the stream and
     * advances the stream position by two bytes.
     *
     * @param value The 2-byte signed integer to write.
     *
     * @throws {EndOfStreamError} Thrown if there is not enough room in the stream to write the `value`.
     */
    public writeInt16(value: number): void {
        if (!Number.isSafeInteger(value)) throw new Error("value must be an integer");
        this.#enforceConstraints(2);
        // Write value
        if (this.#bigEndian) {
            this.#position = this.#buffer.writeInt16BE(value, this.#position);
        } else {
            this.#position = this.#buffer.writeInt16LE(value, this.#position);
        }
    }

    /**
     * Writes a 4-byte signed integer to the stream and
     * advances the stream position by four bytes.
     *
     * @param value The 4-byte signed integer to write.
     *
     * @throws {EndOfStreamError} Thrown if there is not enough room in the stream to write the `value`.
     */
    public writeInt32(value: number): void {
        if (!Number.isSafeInteger(value)) throw new Error("value must be an integer");
        this.#enforceConstraints(4);
        // Write value
        if (this.#bigEndian) {
            this.#position = this.#buffer.writeInt32BE(value, this.#position);
        } else {
            this.#position = this.#buffer.writeInt32LE(value, this.#position);
        }
    }

    /**
     * Writes an 8-byte signed integer to the stream and
     * advances the stream position by eight bytes.
     *
     * @param value The 8-byte signed integer to write.
     *
     * @throws {EndOfStreamError} Thrown if there is not enough room in the stream to write the `value`.
     */
    public writeInt64(value: bigint): void {
        this.#enforceConstraints(8);
        // Write value
        if (this.#bigEndian) {
            this.#position = this.#buffer.writeBigInt64BE(value, this.#position);
        } else {
            this.#position = this.#buffer.writeBigInt64BE(value, this.#position);
        }
    }

    /**
     * Writes a 4-byte floating-point value to the stream and advances
     * the stream position by four bytes.
     * @param value The 4-byte floating-point value to write.
     *
     * @throws {EndOfStreamError} Thrown if there is not enough room in the stream to write the `value`.
     */
    public writeFloat(value: number): void {
        this.#enforceConstraints(4);
        // Write value
        if (this.#bigEndian) {
            this.#position = this.#buffer.writeFloatBE(value, this.#position);
        } else {
            this.#position = this.#buffer.writeFloatLE(value, this.#position);
        }
    }

    /**
     * Writes an 8-byte floating-point value to the stream and advances
     * the stream position by eight bytes.
     * @param value The 8-byte floating-point value to write.
     *
     * @throws {EndOfStreamError} Thrown if there is not enough room in the stream to write the `value`.
     */
    public writeDouble(value: number): void {
        this.#enforceConstraints(8);
        // Write value
        if (this.#bigEndian) {
            this.#position = this.#buffer.writeDoubleBE(value, this.#position);
        } else {
            this.#position = this.#buffer.writeDoubleLE(value, this.#position);
        }
    }

    /**
     * Writes a length-prefixed string to the stream in UTF-8 encoding and
     * advances the current position of the stream.
     * @param value The string to write.
     *
     * @throws {EndOfStreamError} Thrown if there is not enough room in the stream to write the `value`.
     */
    public writeString(value: string): void {
        // Get string length (as number of bytes)
        const length = Buffer.byteLength(value, "utf-8");
        // Enforce constraints
        this.#enforceConstraints(2 + length); // 2 bytes to record the length of the string, plus the length
        // Write length
        if (this.#bigEndian) {
            this.#position = this.#buffer.writeUInt16BE(length, this.#position);
        } else {
            this.#position = this.#buffer.writeUInt16LE(length, this.#position);
        }
        // Write the string
        this.#position += this.#buffer.write(value, this.#position);
    }

    /**
     * Checks the stream to see if `length` number of bytes can be written.
     * Will allocate a new stream with increased size if necessary.
     *
     * @param length The number of bytes to be written.
     * @throws {RangeError} Thrown if `length` is a negative number or not an integer.
     * @throws {EndOfStreamError} Thrown if the stream is full and cannot be expanded.
     */
    #enforceConstraints(length: number): void {
        if (!Number.isSafeInteger(length) || length < 0) {
            throw new RangeError("length must be a non-negative integer");
        }

        const i = this.#position + length;
        // Check for overflow
        if (i > constants.MAX_LENGTH) {
            throw new EndOfStreamError("Cannot write to the stream. The maximum size has been reached.");
        }

        if (i > this.#length) {
            let mustZero = this.#position > this.#length;
            if (i > this.#capacity) {
                const allocatedNewArray = this.#ensureCapacity(i);
                if (allocatedNewArray) {
                    mustZero = false;
                }
            }
            if (mustZero) {
                this.#buffer.fill(0, this.#length, i);
            }
            this.#length = i;
        }
    }

    /**
     * Ensures there is enough room to write `value` number of bytes to the
     * buffer by increasing the size of the buffer if necessary.
     *
     * @param value The number of bytes to be written.
     * @returns True if a new buffer was allocated; otherwise false.
     */
    #ensureCapacity(value: number): boolean {
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new RangeError("value must be a non-negative integer");
        }

        if (value > this.#capacity) {
            let newCapacity = Math.max(value, 256);
            if (newCapacity < this.#capacity * 2) {
                newCapacity = this.#capacity * 2;
            }
            if (this.#capacity * 2 > constants.MAX_LENGTH) {
                newCapacity = Math.max(value, constants.MAX_LENGTH);
            }
            this.capacity = newCapacity;
            return true;
        }
        return false;
    }
}

/**
 * Specifies the position in a stream to use for seeking.
 */
export enum SeekOrigin {
    /** Specifies the beginning of a stream. */
    Begin = 0,
    /** Specifies the current position within a stream. */
    Current = 1,
    /** Specifies the end of a stream. */
    End = 2,
}
