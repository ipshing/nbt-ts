import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing a single string. String is stored in UTF-8 encoding.
 */
export class NbtString extends NbtTag {
    #value = "";

    /**
     * Creates an unnamed `NbtString` tag with a default value of "" (empty string).
     */
    constructor();
    /**
     * Creates an unnamed `NbtString` tag with the given value.
     * @param value The value to assign to this tag.
     */
    constructor(value: string);
    /**
     * Creates an `NbtString` tag with the given name and value.
     *
     * @param tagName The name to assign to this tag.
     * @param value The value to assign to this tag.
     */
    constructor(tagName: string, value: string);
    constructor(nameOrValue?: string, value?: string) {
        super();
        if (value !== undefined) {
            if (nameOrValue !== undefined) {
                this.name = nameOrValue;
            }
            this.value = value;
        } else if (nameOrValue !== undefined) {
            this.value = nameOrValue;
        }
    }

    public get tagType(): NbtTagType {
        return NbtTagType.String;
    }

    /**
     * Gets or sets the value of this tag.
     */
    public get value(): string {
        return this.#value;
    }
    public set value(value: string) {
        this.#value = value;
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtString(this.name, this.value);
        } else {
            return new NbtString(this.value);
        }
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_String";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: "${this.value}"`;

        return output;
    }
}
