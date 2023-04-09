import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing an 8-byte floating-point value
 * stored to a precision of 15 significant digits.
 */
export class NbtDouble extends NbtTag {
    #value = 0;

    /**
     * Creates an unnamed `NbtDouble` tag with a default value of 0.
     */
    constructor();
    /**
     * Creates an `NbtDouble` tag with the given name and default value of 0.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtDouble` tag with the given value.
     * @param value The value to assign to this tag.
     */
    constructor(value: number);
    /**
     * Creates an `NbtDouble` tag with the given name and value.
     * @param tagName The name to assign to this tag.
     * @param value The value to assign to this tag.
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
        return NbtTagType.Double;
    }

    /**
     * Gets or sets the value of this tag.
     */
    public get value(): number {
        return this.#value;
    }
    public set value(value: number) {
        this.#value = Number(value.toPrecision(15));
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtDouble(this.name, this.value);
        } else {
            return new NbtDouble(this.value);
        }
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Double";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: ${this.value}`;

        return output;
    }
}
