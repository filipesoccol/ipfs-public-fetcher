"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchJSON = exports.FetchContent = exports.Initialize = void 0;
const domains_1 = require("./domains");
const Utilities = require("./utilities");
let instance = undefined;
const Initialize = (options) => __awaiter(void 0, void 0, void 0, function* () {
    instance = new IPFSFetcher(options);
});
exports.Initialize = Initialize;
// Wait for gateway connections before try fetch any content 
const waitLoop = (callback) => {
    // If connected return
    if (instance === null || instance === void 0 ? void 0 : instance.ipfsConnected) {
        callback();
        return;
    }
    // Try again if not connected.
    setTimeout(() => {
        if (instance)
            waitLoop(callback);
    }, 100);
};
class IPFSFetcher {
    constructor(options) {
        // True when sucessfully connected with at least two gateways
        this.ipfsConnected = false;
        // True when verbosity is enabled to check errors
        this.verbose = false;
        this.gatewaysFetched = [];
        if (options === null || options === void 0 ? void 0 : options.verbose)
            this.verbose = true;
        if (this.verbose)
            console.log('-- IPFS Starting connection process --');
        const domains = (options === null || options === void 0 ? void 0 : options.customDomains) ? options.customDomains : domains_1.default;
        domains.forEach(gatewayPath => {
            const dateBefore = Date.now();
            // Test each gateway against a 5sec timeout
            Promise.any([
                fetch(gatewayPath.replace(':hash', 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m'), { mode: 'cors', method: 'HEAD' }),
                new Promise((resolve, reject) => { setTimeout(reject, 5000); })
            ]).then((response) => {
                if (
                // Fetch returned successfully
                response.ok
                // In case of customDomains IPFSSubdomain security verification is disabled
                // TODO This line was commented due to apparently there are not so much public domains that uses subdomains
                // customDomains ? true : isIPFS.ipfsSubdomain(response.url)
                ) {
                    return;
                }
                else {
                    throw Error(response.statusText);
                }
            })
                .then(() => {
                // Concat the new fetched gateway and make a fester response sort
                this.gatewaysFetched = this.gatewaysFetched.concat({ path: gatewayPath, errors: 0, response: Date.now() - dateBefore })
                    .sort((a, b) => a.response - b.response);
                if (this.verbose)
                    console.log('Gateway connected: ', this.gatewaysFetched.length, '-', gatewayPath);
                // If more than 3 gateways have succeded, then consider IPFS connected and ready
                if (this.gatewaysFetched.length > 1 && !this.ipfsConnected) {
                    if (this.verbose)
                        console.log('-- IPFS Connected to enough gateways --');
                    this.ipfsConnected = true;
                }
            })
                .catch((err) => {
                if (this.verbose)
                    console.log('Failed to fetch gateway or Path based Gateway', gatewayPath);
            });
        });
    }
}
// Try to fetch a content to via gateway path
class PathResolver {
    constructor(digested, gateway) {
        this.controller = new AbortController();
        this.signal = this.controller.signal;
        this.gatewayPath = gateway ? gateway.path.replace(':hash', digested) : digested;
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                // Fetch digested path from best gateways
                fetch(this.gatewayPath, { method: 'HEAD' })
                    .then((r) => {
                    // If fetched return as soon as possible
                    if (r.ok) {
                        resolve(this.gatewayPath);
                        return;
                    }
                    throw new Error('Error fetching content');
                })
                    .catch((err) => {
                    if (err.name === 'AbortError') {
                        // console.log('Aborted request', this.gateway.path)
                    }
                    else if (this.gateway && err.code && err.code != 20) {
                        this.gateway.errors++;
                    }
                    reject();
                });
            });
        });
    }
    // Kill resolver in case of other fetched faster or timeout
    kill() {
        this.controller.abort();
    }
}
class PersistentFetcher {
    constructor(digested, originalPath) {
        this.digested = digested;
        this.originalPath = originalPath;
        this.resolvers = [];
    }
    // Try persistently to fetch 
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tries = 0;
            this.found = undefined;
            while (!this.found && this.tries < 5) {
                // Se a timeout reference for clear it at the end
                let timeout;
                // Racing the promises for tries
                yield Promise.any(
                // Grab the first 3 best gateways not errored
                instance.gatewaysFetched
                    .filter((g) => g.errors < 8)
                    .slice(0, 3).map((gateway) => {
                    // Try grab the content from one of the gateways
                    const resolver = new PathResolver(this.digested, gateway);
                    this.resolvers.push(resolver);
                    return resolver.fetch();
                })
                    .concat(new Promise((resolve) => {
                    // Concat a timeout promise in case any of the previous resolves correctly
                    timeout = setTimeout(() => {
                        resolve(null);
                    }, 1000);
                }))).then((res) => {
                    // Start clearing the timeout
                    this.resolvers.forEach((r) => r.kill());
                    clearTimeout(timeout);
                    // In case of a successful returned result, set found variable
                    if (res)
                        this.found = res;
                }).catch(() => {
                    clearTimeout(timeout);
                });
                if (!this.found) {
                    // In case of nothing found. Try again and increase the counter
                    this.tries++;
                    clearTimeout(timeout);
                    this.resolvers.forEach((r) => r.kill());
                    this.resolvers = [];
                }
            }
            // In case of successful found a resource, return it.
            if (this.found)
                return this.found;
            // In case of a non successful fetch after 20 tries, return original path
            return this.originalPath;
        });
    }
}
// Fetch fastest IPFS gateway url for the desired content 
const FetchContent = (path) => __awaiter(void 0, void 0, void 0, function* () {
    let digested = Utilities.digestPath(path);
    if (!digested.isIPFS) {
        // In case of fail to digest use same path to fetch
        console.log('Not an IPFS valid path:', path);
        return path;
    }
    // Wait connection to be completed before try to fetch 
    yield new Promise(resolve => { waitLoop(resolve); });
    const fetcher = new PersistentFetcher(digested.cid + digested.subpath, path);
    return fetcher.fetch();
});
exports.FetchContent = FetchContent;
// Fetch a JSON formatted doc from fastest IPFS gateways connected
const FetchJSON = (path) => __awaiter(void 0, void 0, void 0, function* () {
    const newPath = yield (0, exports.FetchContent)(path);
    return new Promise((resolve) => {
        fetch(newPath)
            .then((r) => r.json())
            .then(doc => resolve(doc));
    });
});
exports.FetchJSON = FetchJSON;
