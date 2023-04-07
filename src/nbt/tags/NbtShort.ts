import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing a 2-byte signed integer value.
 */
export class NbtShort extends NbtTag {
    #value = 0;

    /**
     * Creates an unnamed `NbtShort` tag with a default value of 0.
     */
    constructor();
    /**
     * Creates an `NbtShort` tag with the given name and default value of 0.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtShort` tag with the given value.
     * @param value The value to assign to this tag.
     * @throws {RangeError} Thrown if `value` is not an integer ranging from -(2^15) to (2^15 - 1), inclusive.
     */
    constructor(value: number);
    /**
     * Creates an `NbtShort` tag with the given name and value.
     * @param tagName The name to assign to this tag.
     * @param value The value to assign to this tag.
     * @throws {RangeError} Thrown if `value` is not an integer ranging from -(2^15) to (2^15 - 1), inclusive.
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
        return NbtTagType.Short;
    }

    /**
     * Gets or sets the value of this tag.
     *
     * @throws {RangeError} Thrown if assigning a value that is not
     * an integer ranging from -(2^15) to (2^15 - 1), inclusive.
     */
    public get value(): number {
        return this.#value;
    }
    public set value(value: number) {
        if (!Number.isSafeInteger(value) || value < -32768 || value > 32767) {
            throw new RangeError("The value must be an integer from -(2^15) to (2^15 - 1), inclusive.");
        }
        this.#value = value;
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtShort(this.name, this.value);
        } else {
            return new NbtShort(this.value);
        }
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Short";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: ${this.value}`;

        return output;
    }
}
