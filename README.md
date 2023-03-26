<p align="center">
  <a href="https://js.ipfs.io" title="JS IPFS">
    <img src="https://bafybeigefbak6lp2wlyftzpb6gpvw4y3terzrwq5cq6jasib4u42hurknq.ipfs.w3s.link/logo_ipfs.svg" alt="IPFS logo" width="244" />
  </a>
</p>

<h3 align="center">IPFS Public Gateway Fetcher</h3>

IPFS Public Gateway Fetcher is a component that helps you fetch IPFS content without needing to set or configure any gateway. It automatically selects the fastest and most suitable gateways from the Protocol Labs' public gateway list and connects to them to fetch the content. If it fails to fetch data from a gateway multiple times, it removes that gateway from the list and selects another one.

## Features

- Automatically selects the fastest and most suitable gateways to fetch IPFS content.
- Supports various types of IPFS content, including paths with CIDv0 and CIDv1, IPFS protocol paths, pre-filled IPFS gateway paths, CIDv1 with subdomain paths, and non-IPFS URLs.
- Verifies if the passed URL/CID/Path is a valid IPFS link.
- Supports fetching JSON metadata files and images.
- Allows customization of gateways by passing a JS file containing an array of strings.
- Provides an initializer function to connect to peers and fetch domains.
- Provides a function to check if the connection is established.

## Live Demo

You can check out the live demo of the Vue implementation of IPFS Public Gateway Fetcher [here](https://filipesoccol.github.io/vue-ipfs-components-demo/), and the repository [here](https://github.com/filipesoccol/vue-ipfs-components-demo).

## Roadmap to V1

Here's what we plan to add to IPFS Public Gateway Fetcher:

- Improve the conditions for considering IPFS connected.
- Improve the conditions for discarding a connected gateway.
- Add a cache for sucessfuly fetche content.

## Installation

To install IPFS Public Gateway Fetcher in your project, run the following command:

```bash
npm install -s ipfs-public-fetcher
```

You can then use the package as follows:

```js
import {Initialize, FetchJSON, FetchContent, IsConnected} from 'ipfs-public-fetcher'
```

## Usage
To use IPFS Public Gateway Fetcher, you need to first initialize the package to connect peers:

```js
const customDomains = [
  "https://ipfs.io/ipfs/:hash",
	"https://dweb.link/ipfs/:hash",
]

Initialize({customDomains})
```

After that, you can fetch data in two different ways:

```js
const json = await FetchJSON('bafybe...sk3m')
const contentPath = await FetchContent('bafybe...sk3m')
```

You can also verify the connection status at any moment using the following function:

```js
const connected = IsConnected()
```

## References

- Protocol-Labs public gateway list: [Website](https://ipfs.github.io/public-gateway-checker/) / [Repo](https://github.com/ipfs/public-gateway-checker/blob/master/src/gateways.json)
- ConsenSys article related to Gateways security: [Link](https://consensys.net/diligence/blog/2021/06/ipfs-gateway-security/)

