import { SyncDataBucket } from './SyncDataBucket.js';
// TODO JSON
export class SyncDataBatch {
    buckets;
    static fromJSON(json) {
        return new SyncDataBatch(json.buckets.map((bucket) => SyncDataBucket.fromRow(bucket)));
    }
    constructor(buckets) {
        this.buckets = buckets;
    }
}
