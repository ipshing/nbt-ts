import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing an array of signed 4-byte integer values.
 */
export class NbtIntArray extends NbtTag {
    #ints: Int32Array = new Int32Array();

    /**
     * Creates an unnamed `NbtIntArray` tag with an empty array.
     */
    constructor();
    /**
     * Creates an `NbtIntArray` tag with the given name and an empty array.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtIntArray` tag containing the given array.
     * @param values The array to assign to this tag.
     */
    constructor(values: Int32Array);
    /**
     * Creates an `NbtIntArray` tag with the given name, containing the given array.
     * @param tagName The name to assign to this tag.
     * @param values The array to assign to this tag.
     */
    constructor(tagName: string, values: Int32Array);
    constructor(nameOrValue?: string | Int32Array, values?: Int32Array) {
        super();

        if (typeof nameOrValue === "string") {
            this.name = nameOrValue;
            if (values !== undefined) {
                this.values = values;
            }
        } else if (nameOrValue instanceof Int32Array) {
            this.values = nameOrValue;
        }
    }

    public get tagType(): NbtTagType {
        return NbtTagType.IntArray;
    }

    /**
     * Gets or sets the value of this tag.
     * The value is stored as-is and is NOT cloned.
     */
    public get values(): Int32Array {
        return this.#ints;
    }
    public set values(value: Int32Array) {
        this.#ints = value;
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtIntArray(this.name, new Int32Array(this.values));
        } else {
            return new NbtIntArray(new Int32Array(this.values));
        }
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
        output += `: [${this.values.length} ints]`;

        return output;
    }
}
