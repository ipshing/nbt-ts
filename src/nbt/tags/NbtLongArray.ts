import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";
import { NbtLong } from "./NbtLong";

/**
 * An NBT tag containing an array of signed 8-byte integer values.
 */
export class NbtLongArray extends NbtTag {
    #longs: bigint[] = [];

    /**
     * Creates an unnamed, empty `NbtLongArray` tag.
     */
    constructor();
    /**
     * Creates an empty `NbtLongArray` tag with the given name.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtLongArray` tag with the given length.
     * All elements in the array will default to 0.
     * @param arrayLength The starting length of the array.
     */
    constructor(arrayLength: number);
    /**
     * Creates an unnamed `NbtLongArray` tag containing the given array.
     * @param elements The array to assign to this tag.
     * @throws {RangeError} Thrown if a value in `elements` not an 8-byte signed integer.
     */
    constructor(elements: bigint[]);
    /**
     * Creates an `NbtLongArray` tag with the given name and length.
     * All elements in the array will default to 0.
     * @param tagName The name to assign to this tag.
     * @param arrayLength The starting length of the array.
     */
    constructor(tagName: string, arrayLength: number);
    /**
     * Creates an `NbtLongArray` tag with the given name, containing the given array.
     * @param tagName The name to assign to this tag.
     * @param elements The array to assign to this tag.
     * @throws {RangeError} Thrown if a value in `elements` not an 8-byte signed integer.
     */
    constructor(tagName: string, elements: bigint[]);
    constructor(nameSizeElements?: string | number | bigint[], sizeOrElements?: number | bigint[]) {
        super();

        // Set properties
        if (typeof nameSizeElements === "string") {
            this.name = nameSizeElements;
            if (typeof sizeOrElements === "number") {
                this.#longs = new Array<bigint>(sizeOrElements);
            } else if (sizeOrElements instanceof Array<bigint>) {
                this.push(...sizeOrElements);
            }
        } else if (typeof nameSizeElements === "number") {
            this.#longs = new Array<bigint>(nameSizeElements);
        } else if (nameSizeElements instanceof Array<bigint>) {
            this.push(...nameSizeElements);
        }

        // Return proxy for handling index signature
        return new Proxy(this, {
            get(target, prop) {
                if (typeof prop === "string" && Number.isSafeInteger(Number(prop))) {
                    return target.#longs[Number(prop)];
                } else if (typeof target[prop] === "function") {
                    return target[prop].bind(target);
                } else {
                    return target[prop];
                }
            },
            set(target, prop, value) {
                if (typeof prop === "string" && Number.isSafeInteger(Number(prop))) {
                    const key = Number(prop);
                    const val = BigInt(value); // this will validate the value
                    if (key < 0 || key >= target.#longs.length) {
                        throw new RangeError("Index is outside the bounds of this array.");
                    }
                    if (val < NbtLong.MIN_VALUE || val > NbtLong.MAX_VALUE) {
                        throw new RangeError(`Value must be an integer from ${NbtLong.MIN_VALUE} to ${NbtLong.MAX_VALUE}, inclusive.`);
                    }
                    target.#longs[key] = val;
                    return true;
                }
                return Reflect.set(target, prop, value);
            },
        });
    }

    // Set up iterator for the class
    [Symbol.iterator](): IterableIterator<bigint> {
        return this.#longs.values();
    }

    // Set up index signature for accessing elements
    [prop: string | symbol]: any;

    /**
     * Gets the length of the array.
     */
    public get length(): number {
        return this.#longs.length;
    }

    public get tagType(): NbtTagType {
        return NbtTagType.LongArray;
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtLongArray(this.name, this.#longs.slice());
        } else {
            return new NbtLongArray(this.#longs.slice());
        }
    }

    /**
     * Removes the last element from this `NbtLongArray` and returns it.
     * @returns The value of the element that was removed,
     * or undefined if the array was empty.
     */
    public pop(): bigint | undefined {
        return this.#longs.pop();
    }

    /**
     * Appends new elements to the end of this `NbtLongArray`.
     * @param elements The elements to add.
     * @returns The new length of the array.
     * @throws {RangeError} Thrown if a value in `elements` not an 8-byte signed integer.
     */
    public push(...elements: bigint[]): number {
        // Validate elements
        for (const el of elements) {
            if (el < NbtLong.MIN_VALUE || el > NbtLong.MAX_VALUE) {
                throw new RangeError(`Value must be an integer from ${NbtLong.MIN_VALUE} to ${NbtLong.MAX_VALUE}, inclusive.`);
            }
            this.#longs.push(el);
        }

        return this.#longs.length;
    }

    /**
     * Removes the first element from an array and returns it.
     * @returns The value of the element that was removed,
     * or undefined if the array was empty.
     */
    public shift(): bigint | undefined {
        return this.#longs.shift();
    }

    /**
     * Inserts new elements at the start of this `NbtLongArray`.
     * @param elements The elements to add.
     * @returns The new length of the array.
     * @throws {RangeError} Thrown if a value in `elements` not an 8-byte signed integer.
     */
    public unshift(...elements: bigint[]): number {
        // Validate elements (reverse so the order of elements is maintained)
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (el < NbtLong.MIN_VALUE || el > NbtLong.MAX_VALUE) {
                throw new RangeError(`Value must be an integer from ${NbtLong.MIN_VALUE} to ${NbtLong.MAX_VALUE}, inclusive.`);
            }
            this.#longs.unshift(el);
        }

        return this.#longs.length;
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Long_Array";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: [${this.values.length} longs]`;

        return output;
    }
}
