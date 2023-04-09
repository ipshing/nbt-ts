import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";
import { NbtByte } from "./NbtByte";

/**
 * An NBT tag containing an array of signed byte values.
 */
export class NbtByteArray extends NbtTag {
    #bytes: number[] = [];

    /**
     * Creates an unnamed, empty `NbtByteArray` tag.
     */
    constructor();
    /**
     * Creates an empty `NbtByteArray` tag with the given name.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed`NbtByteArray` tag with the given length.
     * All elements in the array will default to 0.
     * @param arrayLength The starting length of the array.
     */
    constructor(arrayLength: number);
    /**
     * Creates an unnamed `NbtByteArray` tag containing the given array of bytes.
     * @param elements The byte array to assign to this tag.
     * @throws {RangeError} Thrown if a value in `elements` not a valid signed byte.
     */
    constructor(elements: number[]);
    /**
     * Creates an `NbtByteArray` tag with the given name and length.
     * All elements in the array will default to 0.
     * @param tagName The name to assign to this tag.
     * @param arrayLength The starting length of the array.
     */
    constructor(tagName: string, arrayLength: number);
    /**
     * Creates an `NbtByteArray` tag with the given name, containing the given array of bytes.
     * @param tagName The name to assign to this tag.
     * @param elements The byte array to assign to this tag.
     * @throws {RangeError} Thrown if a value in `elements` not a valid signed byte.
     */
    constructor(tagName: string, elements: number[]);
    constructor(nameSizeElements?: string | number | number[], sizeOrElements?: number | number[]) {
        super();

        // Set properties
        if (typeof nameSizeElements === "string") {
            this.name = nameSizeElements;
            if (typeof sizeOrElements === "number") {
                this.#bytes = new Array<number>(sizeOrElements);
            } else if (sizeOrElements instanceof Array<number>) {
                this.push(...sizeOrElements);
            }
        } else if (typeof nameSizeElements === "number") {
            this.#bytes = new Array<number>(nameSizeElements);
        } else if (nameSizeElements instanceof Array<number>) {
            this.push(...nameSizeElements);
        }
    }

    // Set up iterator for the class
    [Symbol.iterator](): IterableIterator<number> {
        return this.#bytes.values();
    }

    /**
     * Gets the length of the array.
     */
    public get length(): number {
        return this.#bytes.length;
    }

    public get tagType(): NbtTagType {
        return NbtTagType.ByteArray;
    }

    /**
     * Returns the value located at the specified index.
     * @param index The zero-based index of the array.
     * A negative index will count back from the last item.
     */
    public at(index: number): number | undefined {
        return this.#bytes.at(index);
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtByteArray(this.name, this.#bytes.slice());
        } else {
            return new NbtByteArray(this.#bytes.slice());
        }
    }

    /**
     * Removes the last element from this `NbtByteArray` and returns it.
     * @returns The value of the element that was removed,
     * or undefined if the array was empty.
     */
    public pop(): number | undefined {
        return this.#bytes.pop();
    }

    /**
     * Appends new elements to the end of this `NbtByteArray`.
     * @param elements The elements to add.
     * @returns The new length of the array.
     * @throws {RangeError} Thrown if a value in `elements` not a valid signed byte.
     */
    public push(...elements: number[]): number {
        // Validate elements
        for (const el of elements) {
            if (!Number.isSafeInteger(el) || el < NbtByte.MIN_VALUE || el > NbtByte.MAX_VALUE) {
                throw new RangeError(`Value must be an integer from ${NbtByte.MIN_VALUE} to ${NbtByte.MAX_VALUE}, inclusive.`);
            }
            this.#bytes.push(el);
        }

        return this.#bytes.length;
    }

    /**
     * Removes the first element from an array and returns it.
     * @returns The value of the element that was removed,
     * or undefined if the array was empty.
     */
    public shift(): number | undefined {
        return this.#bytes.shift();
    }

    /**
     * Inserts new elements at the start of this `NbtByteArray`.
     * @param elements The elements to add.
     * @returns The new length of the array.
     * @throws {RangeError} Thrown if a value in `elements` not a valid signed byte.
     */
    public unshift(...elements: number[]): number {
        // Validate elements (reverse so the order of elements is maintained)
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (!Number.isSafeInteger(el) || el < NbtByte.MIN_VALUE || el > NbtByte.MAX_VALUE) {
                throw new RangeError(`Value must be an integer from ${NbtByte.MIN_VALUE} to ${NbtByte.MAX_VALUE}, inclusive.`);
            }
            this.#bytes.unshift(el);
        }

        return this.#bytes.length;
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Byte_Array";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: [${this.#bytes.length} bytes]`;

        return output;
    }
}
