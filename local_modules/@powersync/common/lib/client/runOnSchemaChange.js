export function runOnSchemaChange(callback, db, options) {
    const triggerWatchedQuery = () => {
        const abortController = new AbortController();
        let disposeSchemaListener = null;
        const stopWatching = () => {
            abortController.abort('Abort triggered');
            disposeSchemaListener?.();
            disposeSchemaListener = null;
            // Stop listening to upstream abort for this watch
            options?.signal?.removeEventListener('abort', stopWatching);
        };
        options?.signal?.addEventListener('abort', stopWatching);
        disposeSchemaListener = db.registerListener({
            schemaChanged: async () => {
                stopWatching();
                // Re trigger the watched query (recursively), setTimeout ensures that we don't modify the list of listeners while iterating through them
                setTimeout(() => triggerWatchedQuery(), 0);
            }
        });
        callback(abortController.signal);
    };
    triggerWatchedQuery();
}
