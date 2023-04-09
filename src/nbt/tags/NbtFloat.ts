import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing a 4-byte floating-point value
 * stored to a precision of 7 significant digits.
 */
export class NbtFloat extends NbtTag {
    #value = 0;

    /**
     * Creates an unnamed `NbtFloat` tag with a default value of 0.
     */
    constructor();
    /**
     * Creates an `NbtFloat` tag with the given name and default value of 0.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtFloat` tag with the given value.
     * @param value The value to assign to this tag.
     */
    constructor(value: number);
    /**
     * Creates an `NbtFloat` tag with the given name and value.
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
        return NbtTagType.Float;
    }

    /**
     * Gets or sets the value of this tag.
     */
    public get value(): number {
        return this.#value;
    }
    public set value(value: number) {
        this.#value = Number(value.toPrecision(7));
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtFloat(this.name, this.value);
        } else {
            return new NbtFloat(this.value);
        }
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Float";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: ${this.value}`;

        return output;
    }
}
