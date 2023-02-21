"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.digestPath = void 0;
const is_ipfs_min_js_1 = require("./is-ipfs.min.js");
// REFERENCES:
// https://github.com/ipfs-shipyard/is-ipfs
// Path gateway regex
// Group 1 - ipfs/ipns
// Group 2 - CidV2/CidV1
// Group 3 - subpath
const pathRegex = /^https?:\/\/[^/]+\/(ip[fn]s)\/([^/?#]+)([^?#]+)?/;
// Subdomain gateway regex
// Group 1 - CidV2
// Group 2 - ipfs/ipns
// Group 3 - domain
// Group 4 - subpath
const subdomainRegex = /^https?:\/\/([^/]+)\.(ip[fn]s)\.([^/?]+)([^?#]+)?/;
// Cid + Path regex
// Group 1 - CidV1/CidV2
// Group 2 - subpath
const cidRegex = /^([^/?#]+)([^?#]+)?/;
const ipfsProtocolRegex = /^ipfs:\/\/([^/?#]+)([^?#]+)?/;
// Grab a URL and return 
// cid - if exists
// subpath - if exists
// isIPFS - true/false
const digestPath = (url) => {
    // Gateway Path with/without subpaths
    if (pathRegex.test(url)) {
        const res = url.match(pathRegex);
        return {
            cid: res[2],
            subpath: res[3] ? res[3] : '',
            isIPFS: true
        };
    }
    // Gateway Subdomain with/without subpath
    if (subdomainRegex.test(url)) {
        const res = url.match(subdomainRegex);
        return {
            cid: res[1],
            subpath: res[4] ? res[4] : '',
            isIPFS: true
        };
    }
    // IPFS Path starting with /ipfs/Qm.... remove the /ipfs
    if ((0, is_ipfs_min_js_1.ipfsPath)(url))
        return {
            cid: url.substring(6),
            subpath: '',
            isIPFS: true
        };
    // In case of a path containing CID+subpath
    if ((0, is_ipfs_min_js_1.cidPath)(url)) {
        const res = url.match(cidRegex);
        return {
            cid: res[1],
            subpath: res[2] ? res[2] : '',
            isIPFS: true
        };
    }
    // IPFS Protocol with/without subpath
    if (ipfsProtocolRegex.test(url)) {
        const res = url.match(ipfsProtocolRegex);
        return {
            cid: res[1],
            subpath: res[2] ? res[2] : '',
            isIPFS: true
        };
    }
    // In case of a single CID
    if ((0, is_ipfs_min_js_1.cid)(url))
        return {
            cid: url,
            subpath: '',
            isIPFS: true
        };
    // In case of a single CID
    if ((0, is_ipfs_min_js_1.base32cid)(url))
        return {
            cid: url,
            subpath: '',
            isIPFS: true
        };
    // In case of none of the above, fail.
    return {
        cid: '',
        subpath: url,
        isIPFS: false
    };
};
exports.digestPath = digestPath;
