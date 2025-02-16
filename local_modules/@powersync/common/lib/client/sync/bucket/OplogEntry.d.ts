import { OpId } from './CrudEntry.js';
import { OpType, OpTypeJSON } from './OpType.js';
export interface OplogEntryJSON {
    checksum: number;
    data?: string;
    object_id?: string;
    object_type?: string;
    op_id: string;
    op: OpTypeJSON;
    subkey?: string | object;
}
export declare class OplogEntry {
    op_id: OpId;
    op: OpType;
    checksum: number;
    subkey: string;
    object_type?: string | undefined;
    object_id?: string | undefined;
    data?: string | undefined;
    static fromRow(row: OplogEntryJSON): OplogEntry;
    constructor(op_id: OpId, op: OpType, checksum: number, subkey: string, object_type?: string | undefined, object_id?: string | undefined, data?: string | undefined);
    toJSON(): OplogEntryJSON;
}
