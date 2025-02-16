/**
 * Get a minimal representation of browser, version and operating system.
 *
 * The goal is to get enough environemnt info to reproduce issues, but no
 * more.
 */
export function getUserAgentInfo(nav) {
    nav ??= navigator;
    const browser = getBrowserInfo(nav);
    const os = getOsInfo(nav);
    // The cast below is to cater for TypeScript < 5.5.0
    return [browser, os].filter((v) => v != null);
}
function getBrowserInfo(nav) {
    const brands = nav.userAgentData?.brands;
    if (brands != null) {
        const tests = [
            { name: 'Google Chrome', value: 'Chrome' },
            { name: 'Opera', value: 'Opera' },
            { name: 'Edge', value: 'Edge' },
            { name: 'Chromium', value: 'Chromium' }
        ];
        for (let { name, value } of tests) {
            const brand = brands.find((b) => b.brand == name);
            if (brand != null) {
                return `${value}/${brand.version}`;
            }
        }
    }
    const ua = nav.userAgent;
    const regexps = [
        { re: /(?:firefox|fxios)\/(\d+)/i, value: 'Firefox' },
        { re: /(?:edg|edge|edga|edgios)\/(\d+)/i, value: 'Edge' },
        { re: /opr\/(\d+)/i, value: 'Opera' },
        { re: /(?:chrome|chromium|crios)\/(\d+)/i, value: 'Chrome' },
        { re: /version\/(\d+).*safari/i, value: 'Safari' }
    ];
    for (let { re, value } of regexps) {
        const match = re.exec(ua);
        if (match != null) {
            return `${value}/${match[1]}`;
        }
    }
    return null;
}
function getOsInfo(nav) {
    if (nav.userAgentData?.platform != null) {
        return nav.userAgentData.platform.toLowerCase();
    }
    const ua = nav.userAgent;
    const regexps = [
        { re: /windows/i, value: 'windows' },
        { re: /android/i, value: 'android' },
        { re: /linux/i, value: 'linux' },
        { re: /iphone|ipad|ipod/i, value: 'ios' },
        { re: /macintosh|mac os x/i, value: 'macos' }
    ];
    for (let { re, value } of regexps) {
        if (re.test(ua)) {
            return value;
        }
    }
    return null;
}
