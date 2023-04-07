import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing a collection of unnamed tags, all of the same `NbtTagType`.
 */
export class NbtList extends NbtTag {
    #tags: NbtTag[] = [];
    #listType: NbtTagType = NbtTagType.Unknown;

    /**
     * Creates an unnamed `NbtList` tag with empty contents and an undefined list type.
     */
    constructor();
    /**
     * Creates an `NbtList` tag with the given name, empty contents, and an undefined list type.
     * @param tagName The name to assign to the tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtList` tag with the given contents and inferred list type.
     * @param tags The tags to add to this list.
     */
    constructor(tags: NbtTag[]);
    /**
     * Creates an unnamed `NbtList` tag with empty contents and an explicitly specified list type.
     * @param listType The `NbtTagType` to assign to the this list.
     * @throws {RangeError} Thrown if the `listType` is not a valid `NbtTagType`.
     */
    constructor(listType: NbtTagType);
    /**
     * Creates an `NbtList` tag with the given name and contents. The list type is inferred.
     * @param tagName The name to assign to the tag.
     * @param tags The tags to add to this list.
     */
    constructor(tagName: string, tags: NbtTag[]);
    /**
     * Creates an `NbtList` tag with the given name, specified list type, and empty contents.
     * @param tagName
     * @param listType The `NbtTagType` to assign to the this list.
     * @throws {RangeError} Thrown if the `listType` is not a valid `NbtTagType`.
     */
    constructor(tagName: string, listType: NbtTagType);
    constructor(nameTagsOrType?: unknown, tagsOrType?: NbtTagType | NbtTag[]) {
        super();

        if (typeof nameTagsOrType === "string") {
            this.name = nameTagsOrType;
            if (tagsOrType instanceof Array<NbtTag>) {
                for (const tag of tagsOrType) {
                    this.push(tag);
                }
            } else if (typeof tagsOrType === "number") {
                this.listType = tagsOrType;
            }
        } else if (nameTagsOrType instanceof Array<NbtTag>) {
            for (const tag of nameTagsOrType) {
                this.push(tag);
            }
        } else if (typeof nameTagsOrType === "number") {
            this.listType = nameTagsOrType;
        }
    }

    // Sets up iterator for the class
    [Symbol.iterator](): IterableIterator<NbtTag> {
        return this.#tags.values();
    }

    /**
     * Gets the number of tags contained in the `NbtList`.
     */
    public get length(): number {
        return this.#tags.length;
    }

    /**
     * Gets or sets the tag type of this `NbtList`.
     * All tags in the list must be of the same type.
     * @throws {Error} Thrown if the given `NbtTagType` does not
     * match the type of existing list items.
     * @throws {RangeError} Thrown if the given `NbtTagType` is not a recognized tag type.
     */
    public get listType(): NbtTagType {
        return this.#listType;
    }
    public set listType(value: NbtTagType) {
        if (value === NbtTagType.End) {
            // Empty lists may have type "End"
            if (this.#tags.length > 0) {
                throw new Error("Only empty list tags may have a `listType` of `NbtTagType.End`.");
            }
        } else if (value < NbtTagType.Byte || (value > NbtTagType.LongArray && value != NbtTagType.Unknown)) {
            throw new RangeError("Invalid NbtTagType value");
        }
        if (this.#tags.length > 0) {
            const actualType = this.#tags[0].tagType;
            if (actualType != value) {
                throw new Error(`Given NbtTagType (${NbtTagType[value]}) does not match the actual element type (${NbtTagType[actualType]})`);
            }
        }
        this.#listType = value;
    }

    public get tagType(): NbtTagType {
        return NbtTagType.List;
    }

    /**
     * Returns the `NbtTag` at the specified index.
     * @param index The zero-based index of the desired code unit.
     * A negative index will count back from the last item.
     * @throws {RangeError} Thrown if the specified index is outside the bounds of the list.
     */
    public at(index: number): NbtTag {
        if (Math.abs(index) > this.#tags.length) {
            throw new RangeError("Index cannot be greater than the size of this list.");
        }
        const tag = this.#tags.at(index);
        if (tag === undefined) {
            throw new Error("Could not locate a tag at the given index.");
        }
        return tag;
    }

    /**
     * Removes all tags from this `NbtList`.
     */
    public clear(): void {
        for (const tag of this.#tags) {
            tag.parent = undefined;
        }
        this.#tags.length = 0; // effectively clears the array
    }

    public clone(): NbtTag {
        const clone = new NbtList();
        clone.name = this.name;
        clone.listType = this.listType;
        for (const tag of this.#tags) {
            clone.push(tag.clone());
        }
        return clone;
    }

    /**
     * Determines whether this `NbtList` contains a specified tag.
     * @param tag The tag to search for.
     * @returns `true` if the given tag is found in this `NbtList`; otherwise `false`.
     */
    public includes(tag: NbtTag): boolean {
        return this.#tags.includes(tag);
    }

    /**
     * Returns the index of a given tag in this `NbtList`, or -1 if it is not present.
     * @param tag The tag to locate in the list.
     */
    public indexOf(tag: NbtTag): number {
        return this.#tags.indexOf(tag);
    }

    /**
     * Inserts an `NbtTag` into this list at the given index.
     * @param index The zero-based index at which the tag should be inserted.
     * @param newTag The tag to insert.
     * @throws {RangeError} Thrown if `index` is not a valid index in this `NbtList`.
     * @throws {Error} Thrown if `newTag` is already in another compound/list
     * or does not conform to this list's tag type.
     */
    public insert(index: number, newTag: NbtTag): void {
        if (newTag.parent !== undefined) {
            throw new Error("A tag may only be added to one compound/list at a time.");
        } else if (Object.is(newTag, this) || Object.is(newTag, this.parent)) {
            throw new Error("A list tag may not be added to itself or its child tag.");
        } else if (newTag.name !== undefined) {
            throw new Error("Named tag given. A list may only contain unnamed tags.");
        }
        if (this.#listType !== NbtTagType.Unknown && newTag.tagType !== this.#listType) {
            throw new Error(`Items in this list must be of type ${NbtTagType[this.#listType]}. Given type: ${NbtTagType[newTag.tagType]}`);
        }
        this.#tags.splice(index, 0, newTag);
        if (this.#listType === NbtTagType.Unknown) {
            this.#listType = newTag.tagType;
        }
        newTag.parent = this;
    }

    /**
     * Appends new tags to the end of this `NbtList`.
     * @param tags The tags to add to the list.
     * @throws {Error} Thrown if one of the tags is this list or its parent,
     * is already in another list/compound, is a named tag, or does not
     * match the `NbtTagType` of this list.
     * @returns The new length of the list.
     */
    public push(...tags: NbtTag[]): number {
        for (const newTag of tags) {
            if (newTag.parent !== undefined) {
                throw new Error("A tag may only be added to one compound/list at a time.");
            } else if (Object.is(newTag, this) || Object.is(newTag, this.parent)) {
                throw new Error("A list tag may not be added to itself or its child tag.");
            } else if (newTag.name !== undefined) {
                throw new Error("Named tag given. A list may only contain unnamed tags.");
            }
            if (this.#listType !== NbtTagType.Unknown && newTag.tagType !== this.#listType) {
                throw new Error(`Items in this list must be of type ${NbtTagType[this.#listType]}. Given type: ${NbtTagType[newTag.tagType]}`);
            }

            this.#tags.push(newTag);
            newTag.parent = this;
            if (this.#listType === NbtTagType.Unknown) {
                this.#listType = newTag.tagType;
            }
        }
        return this.#tags.length;
    }

    /**
     * Removes the specified tag from the `NbtList`, if it's present.
     * @param tag The tag to remove.
     * @returns `true` if the tag was successfully removed; otherwise `false`.
     */
    public remove(tag: NbtTag): boolean {
        const index = this.indexOf(tag);
        if (index < 0) {
            return false;
        }
        this.removeAt(index);
        return true;
    }

    /**
     * Removes the tag at the given index.
     * @param index The zero-based index of the tag to remove.
     * @throws {RangeError} Thrown if `index` is not a valid index for this list.
     */
    public removeAt(index: number): void {
        if (index < 0 || index > this.#tags.length - 1) {
            throw new RangeError("Given index is outside the bounds of this list.");
        }
        const tag = this.#tags[index];
        this.#tags.splice(index, 1);
        tag.parent = undefined;
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_List";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: ${this.#tags.length} entries {`;

        // Child tags
        if (this.#tags.length > 0) {
            output += "\n";
            for (const tag of this.#tags) {
                output += tag.toString(indentString, indentLevel + 1);
                output += "\n";
            }
            for (let i = 0; i < indentLevel; i++) {
                output += indentString;
            }
        }

        // Close
        output += "}";

        return output;
    }
}
