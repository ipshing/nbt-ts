/**
 * Compression method used for loading/saving NBT files.
 */
export enum NbtCompression {
    /** Automatically detect file compression. Not a valid format for saving. */
    AutoDetect,

    /** No compression. */
    None,

    /** Compressed, with GZip header (default). */
    Gzip,

    /** Compressed, with ZLib header (RFC-1950). */
    ZLib,
}

/**
 * Enumeration of named binary tag types, and their corresponding codes.
 */
export enum NbtTagType {
    /** Placeholder TagType used to indicate unknown/undefined tag type in NbtList. */
    Unknown = 0xff,

    /** TAG_End: This unnamed tag serves no purpose but to signify the end of an open TAG_Compound. */
    End = 0x00,

    /** TAG_Byte: A single byte. */
    Byte = 0x01,

    /** TAG_Short: A single signed 16-bit integer. */
    Short = 0x02,

    /** TAG_Int: A single signed 32-bit integer. */
    Int = 0x03,

    /** TAG_Long: A single signed 64-bit integer. */
    Long = 0x04,

    /** TAG_Float: A single IEEE-754 single-precision floating point number. */
    Float = 0x05,

    /** TAG_Double: A single IEEE-754 double-precision floating point number. */
    Double = 0x06,

    /** TAG_Byte_Array: A length-prefixed array of bytes. */
    ByteArray = 0x07,

    /** TAG_String: A length-prefixed UTF-8 string. */
    String = 0x08,

    /** TAG_List: A list of nameless tags, all of the same type. */
    List = 0x09,

    /** TAG_Compound: A set of named tags. */
    Compound = 0x0a,

    /** TAG_Int_Array: A length-prefixed array of signed 32-bit integers. */
    IntArray = 0x0b,

    /** TAG_Long_Array: A length-prefixed array of signed 64-bit integers. */
    LongArray = 0x0c,
}
