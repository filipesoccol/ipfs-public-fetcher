var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import sourceDomains from './domains';
import * as Utilities from './utilities';
var instance = undefined;
export var Initialize = function (options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        instance = new IPFSFetcher(options);
        return [2 /*return*/];
    });
}); };
// Wait for gateway connections before try fetch any content 
var waitLoop = function (callback) {
    // If connected return
    if (instance === null || instance === void 0 ? void 0 : instance.ipfsConnected) {
        callback();
        return;
    }
    // Try again if not connected.
    setTimeout(function () {
        if (instance)
            waitLoop(callback);
    }, 100);
};
var IPFSFetcher = /** @class */ (function () {
    function IPFSFetcher(options) {
        var _this = this;
        // True when sucessfully connected with at least two gateways
        this.ipfsConnected = false;
        // True when verbosity is enabled to check errors
        this.verbose = false;
        this.gatewaysFetched = [];
        if (options === null || options === void 0 ? void 0 : options.verbose)
            this.verbose = true;
        if (this.verbose)
            console.log('-- IPFS Starting connection process --');
        var domains = (options === null || options === void 0 ? void 0 : options.customDomains) ? options.customDomains : sourceDomains;
        domains.forEach(function (gatewayPath) {
            var dateBefore = Date.now();
            // Test each gateway against a 5sec timeout
            Promise.any([
                fetch(gatewayPath.replace(':hash', 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m'), { mode: 'cors', method: 'HEAD' }),
                new Promise(function (resolve, reject) { setTimeout(reject, 5000); })
            ]).then(function (response) {
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
                .then(function () {
                // Concat the new fetched gateway and make a fester response sort
                _this.gatewaysFetched = _this.gatewaysFetched.concat({ path: gatewayPath, errors: 0, response: Date.now() - dateBefore })
                    .sort(function (a, b) { return a.response - b.response; });
                if (_this.verbose)
                    console.log('Gateway connected: ', _this.gatewaysFetched.length, '-', gatewayPath);
                // If more than 3 gateways have succeded, then consider IPFS connected and ready
                if (_this.gatewaysFetched.length > 1 && !_this.ipfsConnected) {
                    if (_this.verbose)
                        console.log('-- IPFS Connected to enough gateways --');
                    _this.ipfsConnected = true;
                }
            })["catch"](function (err) {
                if (_this.verbose)
                    console.log('Failed to fetch gateway or Path based Gateway', gatewayPath);
            });
        });
    }
    return IPFSFetcher;
}());
// Try to fetch a content to via gateway path
var PathResolver = /** @class */ (function () {
    function PathResolver(digested, gateway) {
        this.controller = new AbortController();
        this.signal = this.controller.signal;
        this.gatewayPath = gateway ? gateway.path.replace(':hash', digested) : digested;
    }
    PathResolver.prototype.fetch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        // Fetch digested path from best gateways
                        fetch(_this.gatewayPath, { method: 'HEAD' })
                            .then(function (r) {
                            // If fetched return as soon as possible
                            if (r.ok) {
                                resolve(_this.gatewayPath);
                                return;
                            }
                            throw new Error('Error fetching content');
                        })["catch"](function (err) {
                            if (err.name === 'AbortError') {
                                // console.log('Aborted request', this.gateway.path)
                            }
                            else if (_this.gateway && err.code && err.code != 20) {
                                _this.gateway.errors++;
                            }
                            reject();
                        });
                    })];
            });
        });
    };
    // Kill resolver in case of other fetched faster or timeout
    PathResolver.prototype.kill = function () {
        this.controller.abort();
    };
    return PathResolver;
}());
var PersistentFetcher = /** @class */ (function () {
    function PersistentFetcher(digested, originalPath) {
        this.digested = digested;
        this.originalPath = originalPath;
        this.resolvers = [];
    }
    // Try persistently to fetch 
    PersistentFetcher.prototype.fetch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.tries = 0;
                        this.found = undefined;
                        _loop_1 = function () {
                            var timeout;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: 
                                    // Racing the promises for tries
                                    return [4 /*yield*/, Promise.any(
                                        // Grab the first 3 best gateways not errored
                                        instance.gatewaysFetched
                                            .filter(function (g) { return g.errors < 8; })
                                            .slice(0, 3).map(function (gateway) {
                                            // Try grab the content from one of the gateways
                                            var resolver = new PathResolver(_this.digested, gateway);
                                            _this.resolvers.push(resolver);
                                            return resolver.fetch();
                                        })
                                            .concat(new Promise(function (resolve) {
                                            // Concat a timeout promise in case any of the previous resolves correctly
                                            timeout = setTimeout(function () {
                                                resolve(null);
                                            }, 1000);
                                        }))).then(function (res) {
                                            // Start clearing the timeout
                                            _this.resolvers.forEach(function (r) { return r.kill(); });
                                            clearTimeout(timeout);
                                            // In case of a successful returned result, set found variable
                                            if (res)
                                                _this.found = res;
                                        })["catch"](function () {
                                            clearTimeout(timeout);
                                        })];
                                    case 1:
                                        // Racing the promises for tries
                                        _b.sent();
                                        if (!this_1.found) {
                                            // In case of nothing found. Try again and increase the counter
                                            this_1.tries++;
                                            clearTimeout(timeout);
                                            this_1.resolvers.forEach(function (r) { return r.kill(); });
                                            this_1.resolvers = [];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 1;
                    case 1:
                        if (!(!this.found && this.tries < 5)) return [3 /*break*/, 3];
                        return [5 /*yield**/, _loop_1()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 3:
                        // In case of successful found a resource, return it.
                        if (this.found)
                            return [2 /*return*/, this.found
                                // In case of a non successful fetch after 20 tries, return original path
                            ];
                        // In case of a non successful fetch after 20 tries, return original path
                        return [2 /*return*/, this.originalPath];
                }
            });
        });
    };
    return PersistentFetcher;
}());
// Fetch fastest IPFS gateway url for the desired content 
export var FetchContent = function (path) { return __awaiter(void 0, void 0, void 0, function () {
    var digested, fetcher;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                digested = Utilities.digestPath(path);
                if (!digested.isIPFS) {
                    // In case of fail to digest use same path to fetch
                    console.log('Not an IPFS valid path:', path);
                    return [2 /*return*/, path];
                }
                // Wait connection to be completed before try to fetch 
                return [4 /*yield*/, new Promise(function (resolve) { waitLoop(resolve); })];
            case 1:
                // Wait connection to be completed before try to fetch 
                _a.sent();
                fetcher = new PersistentFetcher(digested.cid + digested.subpath, path);
                return [2 /*return*/, fetcher.fetch()];
        }
    });
}); };
// Fetch a JSON formatted doc from fastest IPFS gateways connected
export var FetchJSON = function (path) { return __awaiter(void 0, void 0, void 0, function () {
    var newPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, FetchContent(path)];
            case 1:
                newPath = _a.sent();
                return [2 /*return*/, new Promise(function (resolve) {
                        fetch(newPath)
                            .then(function (r) { return r.json(); })
                            .then(function (doc) { return resolve(doc); });
                    })];
        }
    });
}); };
