import { runOnSchemaChange } from './runOnSchemaChange.js';
export function compilableQueryWatch(db, query, handler, options) {
    const { onResult, onError = (e) => { } } = handler ?? {};
    if (!onResult) {
        throw new Error('onResult is required');
    }
    const watchQuery = async (abortSignal) => {
        try {
            const toSql = query.compile();
            const resolvedTables = await db.resolveTables(toSql.sql, toSql.parameters, options);
            // Fetch initial data
            const result = await query.execute();
            onResult(result);
            db.onChangeWithCallback({
                onChange: async () => {
                    try {
                        const result = await query.execute();
                        onResult(result);
                    }
                    catch (error) {
                        onError(error);
                    }
                },
                onError
            }, {
                ...(options ?? {}),
                tables: resolvedTables,
                // Override the abort signal since we intercept it
                signal: abortSignal
            });
        }
        catch (error) {
            onError(error);
        }
    };
    runOnSchemaChange(watchQuery, db, options);
}
