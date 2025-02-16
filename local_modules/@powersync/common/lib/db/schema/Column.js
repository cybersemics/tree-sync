// https://www.sqlite.org/lang_expr.html#castexpr
export var ColumnType;
(function (ColumnType) {
    ColumnType["TEXT"] = "TEXT";
    ColumnType["INTEGER"] = "INTEGER";
    ColumnType["REAL"] = "REAL";
})(ColumnType || (ColumnType = {}));
const text = {
    type: ColumnType.TEXT
};
const integer = {
    type: ColumnType.INTEGER
};
const real = {
    type: ColumnType.REAL
};
// powersync-sqlite-core limits the number of column per table to 1999, due to internal SQLite limits.
// In earlier versions this was limited to 63.
export const MAX_AMOUNT_OF_COLUMNS = 1999;
export const column = {
    text,
    integer,
    real
};
export class Column {
    options;
    constructor(options) {
        this.options = options;
    }
    get name() {
        return this.options.name;
    }
    get type() {
        return this.options.type;
    }
    toJSON() {
        return {
            name: this.name,
            type: this.type
        };
    }
}
