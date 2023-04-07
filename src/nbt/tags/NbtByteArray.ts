import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing an array of signed byte values.
 */
export class NbtByteArray extends NbtTag {
    #bytes: Int8Array = new Int8Array();

    /**
     * Creates an unnamed `NbtByteArray` tag with an empty array of bytes.
     */
    constructor();
    /**
     * Creates an `NbtByteArray` tag with the given name and an empty array of bytes.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtByteArray` tag containing the given array of bytes.
     * @param values The byte array to assign to this tag.
     */
    constructor(values: Int8Array);
    /**
     * Creates an `NbtByteArray` tag with the given name, containing the given array of bytes.
     * @param tagName The name to assign to this tag.
     * @param values The byte array to assign to this tag.
     */
    constructor(tagName: string, values: Int8Array);
    constructor(nameOrValue?: string | Int8Array, values?: Int8Array) {
        super();

        if (typeof nameOrValue === "string") {
            this.name = nameOrValue;
            if (values !== undefined) {
                this.values = values;
            }
        } else if (nameOrValue instanceof Int8Array) {
            this.values = nameOrValue;
        }
    }

    public get tagType(): NbtTagType {
        return NbtTagType.ByteArray;
    }

    /**
     * Gets or sets the value of this tag.
     * The value is stored as-is and is NOT cloned.
     */
    public get values(): Int8Array {
        return this.#bytes;
    }
    public set values(value: Int8Array) {
        this.#bytes = value;
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtByteArray(this.name, new Int8Array(this.values));
        } else {
            return new NbtByteArray(new Int8Array(this.values));
        }
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
        output += `: [${this.values.length} bytes]`;

        return output;
    }
}
