export var TemporaryStorageOption;
(function (TemporaryStorageOption) {
    TemporaryStorageOption["MEMORY"] = "memory";
    TemporaryStorageOption["FILESYSTEM"] = "file";
})(TemporaryStorageOption || (TemporaryStorageOption = {}));
export function isServerSide() {
    return typeof window == 'undefined';
}
export const DEFAULT_WEB_SQL_FLAGS = {
    broadcastLogs: true,
    disableSSRWarning: false,
    ssrMode: isServerSide(),
    /**
     * Multiple tabs are by default not supported on Android, iOS and Safari.
     * Other platforms will have multiple tabs enabled by default.
     */
    enableMultiTabs: typeof globalThis.navigator !== 'undefined' && // For SSR purposes
        typeof SharedWorker !== 'undefined' &&
        !navigator.userAgent.match(/(Android|iPhone|iPod|iPad)/i) &&
        !window.safari,
    useWebWorker: true
};
export function resolveWebSQLFlags(flags) {
    const resolvedFlags = {
        ...DEFAULT_WEB_SQL_FLAGS,
        ...(flags ?? {})
    };
    if (typeof flags?.enableMultiTabs != 'undefined') {
        resolvedFlags.enableMultiTabs = flags.enableMultiTabs;
    }
    if (flags?.useWebWorker === false) {
        resolvedFlags.enableMultiTabs = false;
    }
    return resolvedFlags;
}
