import { readFileSync, writeFileSync } from "fs";
import { deflateSync, gzipSync, unzipSync } from "zlib";
import { NbtCompression, NbtTagType } from "./Enums";
import { NbtBinaryStream } from "./NbtBinaryStream";
import { EndOfStreamError, NbtFormatError } from "./Errors";
import { NbtByte, NbtByteArray, NbtCompound, NbtDouble, NbtFloat, NbtInt, NbtIntArray, NbtList, NbtLong, NbtLongArray, NbtShort, NbtString, NbtTag } from "./tags";

/**
 *
 */
export class NbtFile {
    static #bigEndianByDefault = true;

    #bigEndian: boolean;
    #fileCompression: NbtCompression;
    #fileName?: string;
    #rootTag: NbtCompound;

    /**
     * Creates an empty `NbtFile` with an empty `NbtCompound` as the root tag.
     */
    constructor();
    /**
     * Creates an `NbtFile` with the given `NbtCompound` as the root tag.
     * @param rootTag The `NbtCompound` to assign to this file's root tag.
     * @throws {Error} Thrown if the name of the `rootTag` is `undefined`.
     */
    constructor(rootTag: NbtCompound);
    constructor(rootTag?: NbtCompound) {
        this.#bigEndian = NbtFile.bigEndianByDefault;
        this.#fileCompression = NbtCompression.AutoDetect;
        if (rootTag === undefined) {
            this.#rootTag = new NbtCompound("");
        } else {
            if (rootTag.name === undefined) {
                throw new Error("Name of root tag cannot be undefined.");
            }
            this.#rootTag = rootTag;
        }
    }

    /**
     * Gets or sets whether new `NbtFiles` should default to
     * big-endian encoding.
     */
    public static get bigEndianByDefault(): boolean {
        return this.#bigEndianByDefault;
    }
    public static set bigEndianByDefault(value: boolean) {
        this.#bigEndianByDefault = value;
    }

    /**
     * Gets or sets whether this file should read/write tags
     * in big-endian encoding format.
     */
    public get bigEndian(): boolean {
        return this.#bigEndian;
    }
    public set bigEndian(value: boolean) {
        this.#bigEndian = value;
    }

    /**
     * Gets the compression method used for most recent loading/saving of this file.
     * Defaults to `NbtCompression.AutoDetect`.
     */
    public get fileCompression(): NbtCompression {
        return this.#fileCompression;
    }

    /**
     * Gets the file name used for most recent loading/saving of this file.
     * May be `undefined` if this `NbtFile` instance has not been
     * loaded from, or saved to, a file.
     */
    public get fileName(): string | undefined {
        return this.#fileName;
    }

    /**
     * Gets or sets the root tag of this file. It must be a named `NbtCompound` tag.
     * Defaults to an empty-named tag.
     */
    public get rootTag(): NbtCompound {
        return this.#rootTag;
    }
    public set rootTag(value: NbtCompound) {
        if (value.name === undefined) throw new Error("The root tag must be named.");
        this.#rootTag = value;
    }

    /**
     * Initializes a new `NbtFile` using NBT data from a `Buffer`.
     * @param buffer The `Buffer` from which the data will be loaded.
     * @param compression The compression method to use for loading the data. Defaults to `NbtCompression.AutoDetect`.
     * @param filter An optional callback used to skip loading certain tags from the `Buffer`.
     * The callback should return `true` for any tag that should be read and `false for any
     * tag that should be skipped.
     * @throws {Error} Thrown if the decompression failed, the end of the buffer was reached
     * before any data could be read, or the opening tag is not a TAG_Compound.
     */
    public static from(buffer: Buffer, compression?: NbtCompression, filter?: (tag: NbtTag) => boolean): NbtFile;
    /**
     * Initializes a new `NbtFile` using NBT data from a file.
     * @param fileName The path to the file containing the NBT data.
     * @param compression The compression method to use for loading the data. Defaults to `NbtCompression.AutoDetect`.
     * @param filter An optional callback used to skip loading certain tags from the file.
     * The callback should return `true` for any tag that should be read and `false for any
     * tag that should be skipped.
     * @throws {Error} Thrown if the decompression failed, the end of the buffer was reached
     * before any data could be read, or the opening tag is not a TAG_Compound.
     */
    public static from(fileName: string, compression?: NbtCompression, filter?: (tag: NbtTag) => boolean): NbtFile;
    public static from(bufferOrFileName?: Buffer | string, compression?: NbtCompression, filter?: (tag: NbtTag) => boolean): NbtFile {
        // Create new NbtFile
        const nbtFile = new NbtFile();

        let buffer: Buffer;
        if (typeof bufferOrFileName === "string") {
            buffer = readFileSync(bufferOrFileName);
            nbtFile.#fileName = bufferOrFileName;
        } else {
            buffer = bufferOrFileName as Buffer;
        }

        // Detect compression
        if (compression === undefined || compression === NbtCompression.AutoDetect) {
            nbtFile.#fileCompression = this.#detectCompression(buffer);
        } else {
            nbtFile.#fileCompression = compression;
        }

        // Decompress buffer
        if (nbtFile.#fileCompression === NbtCompression.Gzip || nbtFile.#fileCompression === NbtCompression.ZLib) {
            buffer = unzipSync(buffer);
        }

        // Create the binary stream reader
        const reader = NbtBinaryStream.from(buffer, nbtFile.bigEndian);

        // Make sure the first byte in this file is the tag for a TAG_Compound
        const firstByte = reader.readByte();
        if (firstByte < 0) {
            throw new Error("End of buffer reached.");
        }
        if (firstByte !== NbtTagType.Compound) {
            throw new Error("Given NBT buffer does not start with a TAG_Compound");
        }

        // Get the root tag as an NbtCompound and read it
        nbtFile.rootTag = new NbtCompound(reader.readString());

        // Get the next tag type
        let tagType = reader.readTagType();
        // Until an End tag is reached, create a new tag and add to the tree
        while (tagType !== NbtTagType.End) {
            // Get the tag's name
            const tagName = reader.readString();

            // Create new tag
            const newTag = this.#readTag(tagType, reader, filter);
            newTag.name = tagName;

            // Apply the filter *after* reading the tag
            if (filter !== undefined && !filter(newTag)) {
                // The data has already been consumed, just call continue
                continue;
            }

            // Add the tag to the root and set parent
            nbtFile.rootTag.add(newTag);
            newTag.parent = nbtFile.rootTag;

            // Get the next type
            tagType = reader.readTagType();
        }

        return nbtFile;
    }

    /**
     * Saves the contents of this `NbtFile` to a `Buffer`.
     * @param compression The `NbtCompression` mode to use for saving. Defaults to `Gzip`. May not be `AutoDetect`.
     * @throws {NbtFormatError} Thrown if the root tag is not named (can be an empty string).
     * @throws {RangeError} Thrown if the compression mode is not valid.
     */
    public saveToBuffer(compression?: NbtCompression): Buffer {
        if (this.rootTag.name === undefined) {
            // This may trigger if the root tag has been renamed
            throw new NbtFormatError("Cannot save NbtFile: Root tag is not named. Its name may be an empty string, but not undefined.");
        }

        // Determine compression
        if (compression === undefined) {
            // Check this.fileCompression
            if (this.fileCompression !== NbtCompression.AutoDetect) {
                // loaded files should always have this set
                compression = this.fileCompression;
            } else {
                // Default to Gzip
                compression = NbtCompression.Gzip;
            }
        }

        // Use switch to validate compression
        switch (compression) {
            case NbtCompression.Gzip:
            case NbtCompression.ZLib:
            case NbtCompression.None:
                break;
            case NbtCompression.AutoDetect:
                throw new RangeError("AutoDetect is not a valid NbtCompression value for saving.");
            default:
                throw new RangeError(`Invalid compression value: ${compression}`);
        }

        // Set up BinaryStream writer
        const writer = new NbtBinaryStream(this.bigEndian);
        // Write root tag (will write all child tags as well)
        this.#writeTag(this.rootTag, writer);

        // Compress
        if (compression === NbtCompression.Gzip) {
            return gzipSync(writer.buffer);
        } else if (compression === NbtCompression.ZLib) {
            return deflateSync(writer.buffer);
        }

        // Return uncompressed
        return writer.buffer;
    }

    /**
     * Saves the contents of this `NbtFile` to the given file path.
     * @param path A string representing the file path to save to.
     * @param compression The `NbtCompression` mode to use for saving. Defaults to `Gzip`. May not be `AutoDetect`.
     * @throws {NbtFormatError} Thrown if the root tag is not named (can be an empty string).
     * @throws {RangeError} Thrown if the compression mode is not valid.
     */
    public saveToFile(path: string, compression?: NbtCompression) {
        const output = this.saveToBuffer(compression);
        writeFileSync(path, output);
    }

    /**
     * Prints the contents of the root tag, and any child tags, to a string.
     */
    public toString(): string;
    /**
     * Prints the contents of the root tag, and any child tags, to a string.
     * @param indentString The string to use for indentation.
     */
    public toString(indentString: string): string;
    public toString(indentString?: string): string {
        if (indentString === undefined) {
            indentString = NbtTag.defaultIndentString;
        }
        return this.rootTag.toString(indentString);
    }

    static #detectCompression(buffer: Buffer): NbtCompression {
        const firstByte = buffer.readInt8();
        switch (firstByte) {
            case -1:
                throw new Error("End of stream reached.");
            case NbtTagType.Compound:
                return NbtCompression.None;
            case 0x1f:
                // GZip magic number
                return NbtCompression.Gzip;
            case 0x78:
                // ZLib header
                return NbtCompression.ZLib;
            default:
                throw new Error("Could not auto-detect compression format.");
        }
    }

    /**
     * Reads the next tag and its data.
     * @param tagType The `NbtTagType` of the tag to read.
     * @param reader The `NbtBinaryStream` containing the data.
     * @param filter An optional callback used to skip loading certain tags from the `Buffer`.
     * The callback should return `true` for any tag that should be read and `false for any
     * tag that should be skipped.
     */
    static #readTag(tagType: NbtTagType, reader: NbtBinaryStream, filter?: (tag: NbtTag) => boolean): NbtTag {
        // Create a new tag based on the type and read the tag's data.
        // Value types just need the value read. Arrays will need the
        // length followed by that many reads of the appropriate type.
        // Compounds and Lists will need to recurse.
        switch (tagType) {
            case NbtTagType.Byte:
                return new NbtByte(reader.readByte());

            case NbtTagType.Short:
                return new NbtShort(reader.readInt16());

            case NbtTagType.Int:
                return new NbtInt(reader.readInt32());

            case NbtTagType.Long:
                return new NbtLong(reader.readInt64());

            case NbtTagType.Float:
                return new NbtFloat(reader.readFloat());

            case NbtTagType.Double:
                return new NbtDouble(reader.readDouble());

            case NbtTagType.String:
                return new NbtString(reader.readString());

            case NbtTagType.ByteArray: {
                // Get length
                const length = reader.readInt32();
                if (length < 0) {
                    throw new NbtFormatError("Negative length given in TAG_Byte_Array");
                }
                // Read values
                const values = reader.readBytes(length);
                if (values.length < length) {
                    throw new EndOfStreamError("End of stream reached before filling TAG_Byte_Array");
                }
                return new NbtByteArray(values);
            }
            case NbtTagType.IntArray: {
                // Get length
                const length = reader.readInt32();
                if (length < 0) {
                    throw new NbtFormatError("Negative length given in TAG_Int_Array");
                }
                // Read values
                const values = new Int32Array(length);
                for (let i = 0; i < length; i++) {
                    values[i] = reader.readInt32();
                }
                return new NbtIntArray(values);
            }
            case NbtTagType.LongArray: {
                // Get length
                const length = reader.readInt32();
                if (length < 0) {
                    throw new NbtFormatError("Negative length given in TAG_Long_Array");
                }
                // Read values
                const values = new BigInt64Array(length);
                for (let i = 0; i < length; i++) {
                    values[i] = reader.readInt64();
                }
                return new NbtLongArray(values);
            }
            case NbtTagType.Compound:
                // Create empty compound
                const compound = new NbtCompound();
                // Get the first child tag type
                let childType = reader.readTagType();
                // Read in tags until End tag is reached
                while (childType !== NbtTagType.End) {
                    // Get the child tag's name
                    const tagName = reader.readString();

                    // Recurse to create the new tag
                    const childTag = this.#readTag(childType, reader, filter);
                    childTag.name = tagName;

                    // Apply the filter *after* reading the tag
                    if (filter !== undefined && !filter(childTag)) {
                        // The data has already been consumed, just call continue
                        continue;
                    }

                    // Add the tag to this compound and set parent
                    compound.add(childTag);
                    childTag.parent = compound;

                    // Get the next child tag type
                    childType = reader.readTagType();
                }
                return compound;

            case NbtTagType.List:
                // Create empty list
                const list = new NbtList();
                // Get list type
                list.listType = reader.readTagType();
                // Get length
                const length = reader.readInt32();
                if (length < 0) {
                    throw new NbtFormatError("Negative list size given.");
                }

                // Read in items
                for (let i = 0; i < length; i++) {
                    // Recurse to create the new tag
                    const childTag = this.#readTag(list.listType, reader, filter);
                    // No names in NbtList tags

                    // Apply the filter *after* reading the tag
                    if (filter !== undefined && !filter(childTag)) {
                        // The data has already been consumed, just call continue
                        continue;
                    }

                    // Add tag to this list and set parent
                    list.push(childTag);
                    childTag.parent = list;
                }
                return list;

            default:
                throw new NbtFormatError(`Cannot read tag data, unsupported tag type: ${tagType}`);
        }
    }

    #writeTag(tag: NbtTag, writer: NbtBinaryStream): void {
        if (tag.name === undefined) throw new NbtFormatError("Name cannot be undefined.");

        writer.writeTagType(tag.tagType);
        writer.writeString(tag.name);
        this.#writeTagData(tag, writer);
    }

    #writeTagData(tag: NbtTag, writer: NbtBinaryStream): void {
        switch (tag.tagType) {
            case NbtTagType.Byte:
                writer.writeByte((tag as NbtByte).value);
                break;

            case NbtTagType.Short:
                writer.writeInt16((tag as NbtShort).value);
                break;

            case NbtTagType.Int:
                writer.writeInt32((tag as NbtInt).value);
                break;

            case NbtTagType.Long:
                writer.writeInt64((tag as NbtLong).value);
                break;

            case NbtTagType.Float:
                writer.writeFloat((tag as NbtFloat).value);
                break;

            case NbtTagType.Double:
                writer.writeDouble((tag as NbtDouble).value);
                break;

            case NbtTagType.String:
                writer.writeString((tag as NbtString).value);
                break;

            case NbtTagType.ByteArray:
                // Write array length
                writer.writeInt32((tag as NbtByteArray).values.length);
                // Write values
                for (const byte of (tag as NbtByteArray).values) {
                    writer.writeByte(byte);
                }
                break;

            case NbtTagType.IntArray:
                // Write array length
                writer.writeInt32((tag as NbtIntArray).values.length);
                // Write values
                for (const int of (tag as NbtIntArray).values) {
                    writer.writeInt32(int);
                }
                break;

            case NbtTagType.LongArray:
                // Write array length
                writer.writeInt32((tag as NbtLongArray).values.length);
                // Write values
                for (const long of (tag as NbtLongArray).values) {
                    writer.writeInt64(long);
                }
                break;

            case NbtTagType.Compound:
                for (const childTag of (tag as NbtCompound).tags) {
                    this.#writeTag(childTag, writer);
                }
                writer.writeTagType(NbtTagType.End);
                break;

            case NbtTagType.List:
                const list = tag as NbtList;
                if (list.listType === NbtTagType.Unknown) {
                    throw new NbtFormatError("NbtList had no elements and an unknown list type.");
                }
                writer.writeTagType(list.listType);
                writer.writeInt32(list.length);
                for (const childTag of list) {
                    this.#writeTagData(childTag, writer);
                }
                break;

            default:
                throw new NbtFormatError(`Cannot write tag data, unsupported tag type: ${tag.tagType}`);
        }
    }
}
