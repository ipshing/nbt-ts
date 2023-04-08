import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing a single signed byte.
 */
export class NbtByte extends NbtTag {
    static readonly MIN_VALUE = -128;
    static readonly MAX_VALUE = 127;

    #value = 0;

    /**
     * Creates an unnamed `NbtByte` tag with a default value of 0.
     */
    constructor();
    /**
     * Creates an `NbtByte` tag with the given name and default value of 0.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtByte` tag with the given value.
     * @param value The value to assign to this tag.
     * @throws {RangeError} Thrown if `value` is not an integer ranging from -128 to 127, inclusive.
     */
    constructor(value: number);
    /**
     * Creates an `NbtByte` tag with the given name and value.
     * @param tagName The name to assign to this tag.
     * @param value The value to assign to this tag.
     * @throws {RangeError} Thrown if `value` is not an integer ranging from -128 to 127, inclusive.
     */
    constructor(tagName: string, value: number);
    constructor(nameOrValue?: string | number, value?: number) {
        super();
        if (typeof nameOrValue === "string") {
            this.name = nameOrValue;
            if (value !== undefined) {
                this.value = value;
            }
        } else if (typeof nameOrValue === "number") {
            this.value = nameOrValue;
        }
    }

    public get tagType(): NbtTagType {
        return NbtTagType.Byte;
    }

    /**
     * Gets or sets the value of this tag.
     *
     * @throws {RangeError} Thrown if assigning a value that is invalid for this type.
     */
    public get value(): number {
        return this.#value;
    }
    public set value(value: number) {
        if (!Number.isSafeInteger(value) || value < NbtByte.MIN_VALUE || value > NbtByte.MAX_VALUE) {
            throw new RangeError(`Value must be an integer from ${NbtByte.MIN_VALUE} to ${NbtByte.MAX_VALUE}, inclusive.`);
        }
        this.#value = value;
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtByte(this.name, this.value);
        } else {
            return new NbtByte(this.value);
        }
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Byte";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: ${this.value}`;

        return output;
    }
}
