import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing an array of signed 8-byte integer values.
 */
export class NbtLongArray extends NbtTag {
    #longs: BigInt64Array = new BigInt64Array();

    /**
     * Creates an unnamed `NbtLongArray` tag with an empty array.
     */
    constructor();
    /**
     * Creates an `NbtLongArray` tag with the given name and an empty array.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtLongArray` tag containing the given array.
     * @param values The array to assign to this tag.
     */
    constructor(values: BigInt64Array);
    /**
     * Creates an `NbtLongArray` tag with the given name, containing the given array.
     * @param tagName The name to assign to this tag.
     * @param values The array to assign to this tag.
     */
    constructor(tagName: string, values: BigInt64Array);
    constructor(nameOrValue?: string | BigInt64Array, values?: BigInt64Array) {
        super();

        if (typeof nameOrValue === "string") {
            this.name = nameOrValue;
            if (values !== undefined) {
                this.values = values;
            }
        } else if (nameOrValue instanceof BigInt64Array) {
            this.values = nameOrValue;
        }
    }

    public get tagType(): NbtTagType {
        return NbtTagType.LongArray;
    }

    /**
     * Gets or sets the value of this tag.
     * The value is stored as-is and is NOT cloned.
     */
    public get values(): BigInt64Array {
        return this.#longs;
    }
    public set values(value: BigInt64Array) {
        this.#longs = value;
    }

    public clone(): NbtTag {
        if (this.name !== undefined) {
            return new NbtLongArray(this.name, new BigInt64Array(this.values));
        } else {
            return new NbtLongArray(new BigInt64Array(this.values));
        }
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
