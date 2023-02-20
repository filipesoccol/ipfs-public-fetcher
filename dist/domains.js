(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    exports["default"] = [
        "https://ipfs.io/ipfs/:hash",
        "https://cf-ipfs.com/ipfs/:hash",
        "https://dweb.link/ipfs/:hash",
        "https://ipfs-gateway.cloud/ipfs/:hash",
        "https://w3s.link/ipfs/:hash",
        "https://cloudflare-ipfs.com/ipfs/:hash",
        "https://nftstorage.link/ipfs/:hash",
        "https://api.estuary.tech/gw/ipfs/:hash",
        "https://strn.pl/ipfs/:hash",
        "https://ipfs.eth.aragon.network/ipfs/:hash",
        "https://ipfs.joaoleitao.org/ipfs/:hash",
        "https://gateway.pinata.cloud/ipfs/:hash",
        "https://4everland.io/ipfs/:hash",
    ];
});
