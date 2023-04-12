import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";
import { NbtInt } from "./NbtInt";

/**
 * An NBT tag containing an array of signed 4-byte integer values.
 */
export class NbtIntArray extends NbtTag {
    #ints: number[] = [];

    /**
     * Creates an unnamed, empty `NbtIntArray` tag.
     */
    constructor();
    /**
     * Creates an empty `NbtIntArray` tag with the given name.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtIntArray` tag with the given length.
     * All elements in the array will default to 0.
     * @param arrayLength The starting length of the array.
     */
    constructor(arrayLength: number);
    /**
     * Creates an unnamed `NbtIntArray` tag containing the given array.
     * @param elements The array to assign to this tag.
     * @throws {RangeError} Thrown if a value in `elements` not a 4-byte signed integer.
     */
    constructor(elements: number[]);
    /**
     * Creates an `NbtIntArray` tag with the given name and length.
     * All elements in the array will default to 0.
     * @param tagName The name to assign to this tag.
     * @param arrayLength The starting length of the array.
     */
    constructor(tagName: string, arrayLength: number);
    /**
     * Creates an `NbtIntArray` tag with the given name, containing the given array.
     * @param tagName The name to assign to this tag.
     * @param elements The array to assign to this tag.
     * @throws {RangeError} Thrown if a value in `elements` not a 4-byte signed integer.
     */
    constructor(tagName: string, elements: number[]);
    constructor(nameSizeElements?: string | number | number[], sizeOrElements?: number | number[]) {
        super();

        // Set properties
        if (typeof nameSizeElements === "string") {
            this.name = nameSizeElements;
            if (typeof sizeOrElements === "number") {
                this.#ints = new Array<number>(sizeOrElements);
            } else if (sizeOrElements instanceof Array<number>) {
                this.push(...sizeOrElements);
            }
        } else if (typeof nameSizeElements === "number") {
            this.#ints = new Array<number>(nameSizeElements);
        } else if (nameSizeElements instanceof Array<number>) {
            this.push(...nameSizeElements);
        }
    }

    // Set up iterator for the class
    [Symbol.iterator](): IterableIterator<number> {
        return this.#ints.values();
    }

    /**
     * Gets the length of the array.
     */
    public get length(): number {
        return this.#ints.length;
    }

    public get tagType(): NbtTagType {
        return NbtTagType.IntArray;
    }

    /**
     * Gets the values stored in this `NbtByteArray`.
     */
    public get values(): number[] {
        return this.#ints.slice();
    }

    /**
     * Returns the value located at the specified index.
     * @param index The zero-based index of the array.
     * A negative index will count back from the last item.
     */
    public at(index: number): number | undefined {
        return this.#ints.at(index);
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtIntArray(this.name, this.#ints.slice());
        } else {
            return new NbtIntArray(this.#ints.slice());
        }
    }

    /**
     * Removes the last element from this `NbtIntArray` and returns it.
     * @returns The value of the element that was removed,
     * or undefined if the array was empty.
     */
    public pop(): number | undefined {
        return this.#ints.pop();
    }

    /**
     * Appends new elements to the end of this `NbtIntArray`.
     * @param elements The elements to add.
     * @returns The new length of the array.
     * @throws {RangeError} Thrown if a value in `elements` not a 4-byte signed integer.
     */
    public push(...elements: number[]): number {
        // Validate elements
        for (const el of elements) {
            if (!Number.isSafeInteger(el) || el < NbtInt.MIN_VALUE || el > NbtInt.MAX_VALUE) {
                throw new RangeError(`Value must be an integer from ${NbtInt.MIN_VALUE} to ${NbtInt.MAX_VALUE}, inclusive.`);
            }
            this.#ints.push(el);
        }

        return this.#ints.length;
    }

    /**
     * Removes the first element from an array and returns it.
     * @returns The value of the element that was removed,
     * or undefined if the array was empty.
     */
    public shift(): number | undefined {
        return this.#ints.shift();
    }

    /**
     * Inserts new elements at the start of this `NbtIntArray`.
     * @param elements The elements to add.
     * @returns The new length of the array.
     * @throws {RangeError} Thrown if a value in `elements` not a 4-byte signed integer.
     */
    public unshift(...elements: number[]): number {
        // Validate elements (reverse so the order of elements is maintained)
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (!Number.isSafeInteger(el) || el < NbtInt.MIN_VALUE || el > NbtInt.MAX_VALUE) {
                throw new RangeError(`Value must be an integer from ${NbtInt.MIN_VALUE} to ${NbtInt.MAX_VALUE}, inclusive.`);
            }
            this.#ints.unshift(el);
        }

        return this.#ints.length;
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Int_Array";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: [${this.length} ints]`;

        return output;
    }
}
