import { NbtTag } from "./NbtTag";
import { NbtTagType } from "../Enums";

/**
 * An NBT tag containing a collection of other named tags. Order is not guaranteed.
 */
export class NbtCompound extends NbtTag {
    #tags: Map<string, NbtTag> = new Map<string, NbtTag>();

    /**
     * Creates an unnamed `NbtCompound` tag with an empty collection.
     */
    constructor();
    /**
     * Creates an `NbtCompound` tag with an empty collection.
     * @param tagName The name to assign to this tag.
     */
    constructor(tagName: string);
    /**
     * Creates an unnamed `NbtCompound` tag with the given collection of tags.
     * @param tags Collection of tags to assign to this tag's value.
     *
     * @throws {Error} Thrown if some of the given tags are not named or
     * two tags with the same name are in the `tags` collection.
     */
    constructor(tags: NbtTag[]);
    /**
     * Creates an `NbtCompound` tag with the given name and collection of tags.
     *
     * @param tagName The name to assign to this tag.
     * @param tags Collection of tags to assign to this tag's value.
     *
     * @throws {Error} Thrown if some of the given tags are not named or
     * two tags with the same name are in the `tags` collection.
     */
    constructor(tagName: string, tags: NbtTag[]);
    constructor(nameOrTags?: string | NbtTag[], tags?: NbtTag[]) {
        super();

        if (typeof nameOrTags === "string") {
            this.name = nameOrTags;
        } else if (nameOrTags !== undefined) {
            tags = nameOrTags;
        }
        if (tags !== undefined) {
            for (const tag of tags) {
                this.add(tag);
            }
        }
    }

    // Sets up iterator for the class
    [Symbol.iterator](): IterableIterator<[string, NbtTag]> {
        return this.#tags.entries();
    }

    /**
     * Gets a collection containing all the tag names in this `NbtCompound`.
     */
    public get names(): Set<string> {
        return new Set<string>(this.#tags.keys());
    }

    /**
     * Gets the number of tags contained within this `NbtCompound`.
     */
    public get size(): number {
        return this.#tags.size;
    }

    /**
     * Gets an array containing all the tags in this `NbtCompound`.
     */
    public get tags(): NbtTag[] {
        return [...this.#tags.values()];
    }

    public get tagType(): NbtTagType {
        return NbtTagType.Compound;
    }

    /**
     * Adds a tag to this `NbtCompound`.
     * @param newTag  The tag to add.
     * @throws {Error} Thrown if `newTag` is this `NbtCompound`, `newTag` is unnamed,
     * `newTag` is already in another `NbtCompound` or `NbtList`, or if `newTag`
     * already exists in this `NbtCompound`.
     */
    public add(newTag: NbtTag): void {
        if (Object.is(newTag, this)) {
            throw new Error("Cannot add tag to itself.");
        }
        if (newTag.name === undefined) {
            throw new Error("Only named tags area allowed in compound tags.");
        }
        if (newTag.parent !== undefined) {
            throw new Error("A tag may only be added to one compound/list at a time.");
        }
        if (this.names.has(newTag.name)) {
            throw new Error("A tag with this name alread exists in the compound tag.");
        }

        // Add the tag and set its parent
        this.#tags.set(newTag.name, newTag);
        newTag.parent = this;
    }

    /**
     * Removes all tags from this `NbtCompound`.
     */
    public clear(): void {
        this.#tags.clear();
    }

    public clone(): NbtTag {
        const clone = new NbtCompound();
        clone.name = this.name;
        for (const tag of this.tags) {
            clone.add(tag.clone());
        }
        return clone;
    }

    /**
     * Gets the tag with the specified name or `undefined` if no tag was found.
     * @param tagName The name of the tag to get.
     * @returns The `NbtTag` or `undefined` if no tag was found.
     */
    public get(tagName: string): NbtTag | undefined {
        return this.#tags.get(tagName);
    }

    /**
     * Determines whether this `NbtCompound` contains a tag with the specified name.
     * @param tagName The tag name to search for.
     * @returns `true` if a tag with the given name was found; otherwise `false`.
     */
    public has(tagName: string): boolean;
    /**
     * Determines whether this `NbtCompound` contains the specified `NbtTag`.
     * Looks for exact object matches, not name matches.
     * @param tag The `NbtTag` to search for.
     * @returns `true` if the specified tag was found; otherwise `false`.
     */
    public has(tag: NbtTag): boolean;
    public has(nameOrTag: string | NbtTag): boolean {
        if (typeof nameOrTag === "string") {
            return this.#tags.has(nameOrTag);
        } else if (nameOrTag.name !== undefined) {
            return this.#tags.has(nameOrTag.name);
        } else {
            return false;
        }
    }

    /**
     * Removes the tag with the specified name from this `NbtCompound`.
     * @param tagName The name of tag to remove.
     * @returns `true` if the tag is successfully found and removed; otherwise `false`.
     */
    public delete(tagName: string): boolean;
    /**
     * Removes the specified `NbtTag` from this `NbtCompound`.
     * @param tag The tag to remove.
     * @returns `true` if the tag is successfully found and removed; otherwise `false`.
     */
    public delete(tag: NbtTag): boolean;
    public delete(nameOrTag: string | NbtTag): boolean {
        if (typeof nameOrTag === "string") {
            const tag = this.get(nameOrTag);
            if (tag !== undefined) {
                this.#tags.delete(nameOrTag);
                tag.parent = undefined;
                return true;
            }
        } else {
            if (nameOrTag.name === undefined) {
                throw new Error("Trying to remove an unnamed tag.");
            }
            const maybeTag = this.get(nameOrTag.name);
            if (Object.is(maybeTag, nameOrTag) && this.#tags.delete(nameOrTag.name)) {
                nameOrTag.parent = undefined;
                return true;
            }
        }

        return false;
    }

    /**
     * Renames a tag within this `NbtCompound`.
     * @param oldName The current name of the tag.
     * @param newName The desired name of the tag.
     * @throws {Error} Thrown if a tag with the same name already exists
     * or if no tag with the specified name can be found.
     */
    public renameTag(oldName: string, newName: string): void {
        if (oldName === newName) {
            return;
        }
        if (this.names.has(newName)) {
            throw new Error("Cannot rename: a tag with the name already exists in this compound.");
        }
        const tag = this.#tags.get(oldName);
        if (tag === undefined) {
            throw new Error("Cannot rename: no tag found in this compound to rename.");
        }
        this.#tags.delete(oldName);
        this.#tags.set(newName, tag);
    }

    public toString(indentString = NbtTag.defaultIndentString, indentLevel = 0): string {
        let output = "";

        // Indent
        for (let i = 0; i < indentLevel; i++) {
            output += indentString;
        }

        // Tag info
        output += "TAG_Compound";
        if (this.name !== undefined && this.name.trim().length > 0) {
            output += `("${this.name}")`;
        }
        output += `: ${this.#tags.size} entries {`;

        // Child tags
        if (this.#tags.size > 0) {
            output += "\n";
            for (const [, tag] of this.#tags) {
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
