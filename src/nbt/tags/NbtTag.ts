import { NbtTagType } from "../Enums";
import { NbtFormatError } from "../Errors";
import { NbtCompound } from "./NbtCompound";
import { NbtList } from "./NbtList";

/**
 * Base class for different kinds of named binary tags.
 */
export abstract class NbtTag {
    static #defaultIntentString = "  ";
    #name?: string;
    #parent?: NbtTag;

    /**
     * Gets or sets the string to use for indentation in the toString method.
     */
    public static get defaultIndentString(): string {
        return this.#defaultIntentString;
    }
    public static set defaultIndentString(value: string) {
        this.#defaultIntentString = value;
    }

    /**
     * Gets or sets the name of this tag.
     *
     * @throws {NbtFormatError} Throws an error if the name supplied
     * is not a valid string and `parent` is an `NbtCompound`.
     *
     * @throws {Error} Throws an error if this tag is in an `NbtCompound`
     * and a sibling tag with the same name already exists.
     */
    public get name(): string | undefined {
        return this.#name;
    }
    public set name(value: string | undefined) {
        if (this.#name === value) return;

        if (this.#parent !== undefined && this.#parent.tagType === NbtTagType.Compound) {
            if (value === undefined) {
                throw new NbtFormatError("Tags inside of an NbtCompound must be named.");
            }
            // Use NbtCompound.renameTag to ensure the new name is valid
            // (this.#name should never be undefined at this point)
            (this.#parent as NbtCompound).renameTag(this.#name as string, value);
        }

        this.#name = value;
    }

    /**
     * Gets or sets the parent tag (either an `NbtCompound` or `NbtList`), if any.
     */
    public get parent(): NbtTag | undefined {
        return this.#parent;
    }
    public set parent(value: NbtTag | undefined) {
        this.#parent = value;
    }

    /**
     * Gets the full name of this tag, including all parent tag names,
     * separated by dots. Unnamed tags show as empty string.
     */
    public get path(): string {
        if (this.#parent === undefined) {
            return this.#name ?? "";
        }
        if (this.#parent !== undefined && this.#parent.tagType === NbtTagType.List) {
            const parentAsList = this.#parent as NbtList;
            return `${parentAsList.path}[${parentAsList.indexOf(this)}]`;
        } else {
            return `${this.#parent.path}.${this.name}`;
        }
    }

    /** Gets the `NbtTagType` of this tag. */
    public abstract get tagType(): NbtTagType;

    /**
     * Creates a deep copy of this tag.
     * @returns A new `NbtTag` that is a deep copy of this instance.
     */
    public abstract clone(): NbtTag;

    /**
     * Creates a string representing the contents of this tag and any child tags.
     * Indents the string using multiples of `NbtTag.defaultIndentString`.
     */
    public abstract toString(): string;
    /**
     * Creates a string representing the contents of this tag and any child tags.
     * Indents the string using multiples of the given indentation string.
     *
     * @param indentString The string to be used for indentation.
     */
    public abstract toString(indentString: string): string;
    /**
     * Creates a string representing the contents of this tag and any child tags.
     * Indents the string using the given indentation string a number of times
     * equal to the specified level.
     *
     * @param indentString The string to be used for indentation.
     * @param indentLevel The level at which this tag is nested.
     * @returns The formatted string of this tag and any child tags.
     */
    public abstract toString(indentString: string, indentLevel: number): string;
}
