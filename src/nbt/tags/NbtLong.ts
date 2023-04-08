import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing an 8-byte signed integer value.
 */
export class NbtLong extends NbtTag {
    static readonly MIN_VALUE = -9223372036854775808n;
    static readonly MAX_VALUE = 9223372036854775807n;

    #value = 0n;

    /**
     * Creates an unnamed `NbtLong` tag with a default value of 0.
     */
    constructor();
    /**
     * Creates an `NbtLong` tag with the given name and default value of 0.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtLong` tag with the given value.
     * @param value The value to assign to this tag.
     * @throws {RangeError} Thrown if `value` is not an integer ranging from -(2^63) to (2^63 - 1), inclusive.
     */
    constructor(value: bigint);
    /**
     * Creates an `NbtLong` tag with the given name and value.
     * @param tagName The name to assign to this tag.
     * @param value The value to assign to this tag.
     * @throws {RangeError} Thrown if `value` is not an integer ranging from -(2^63) to (2^63 - 1), inclusive.
     */
    constructor(tagName: string, value: bigint);
    constructor(nameOrValue?: string | bigint, value?: bigint) {
        super();
        if (typeof nameOrValue === "string") {
            this.name = nameOrValue;
            if (value !== undefined) {
                this.value = value;
            }
        } else if (typeof nameOrValue === "bigint") {
            this.value = nameOrValue;
        }
    }

    public get tagType(): NbtTagType {
        return NbtTagType.Long;
    }

    /**
     * Gets or sets the value of this tag.
     *
     * @throws {RangeError} Thrown if assigning a value that is not
     * an integer ranging from -(2^63) to (2^63 - 1), inclusive.
     */
    public get value(): bigint {
        return this.#value;
    }
    public set value(value: bigint) {
        if (!Number.isSafeInteger(value) || value < NbtLong.MIN_VALUE || value > NbtLong.MAX_VALUE) {
            throw new RangeError(`Value must be an integer from ${NbtLong.MIN_VALUE} to ${NbtLong.MAX_VALUE}, inclusive.`);
        }
        this.#value = value;
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtLong(this.name, this.value);
        } else {
            return new NbtLong(this.value);
        }
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Long";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: ${this.value}`;

        return output;
    }
}
