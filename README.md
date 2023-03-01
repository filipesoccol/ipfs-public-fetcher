<p align="center">
  <a href="https://js.ipfs.io" title="JS IPFS">
    <img src="https://bafybeigefbak6lp2wlyftzpb6gpvw4y3terzrwq5cq6jasib4u42hurknq.ipfs.w3s.link/logo_ipfs.svg" alt="IPFS logo" width="244" />
  </a>
</p>

<h3 align="center">IPFS Public Gateway Fetcher</h3>

### Load any IPFS content from the fastest gateway available just passing a valid path.

The component itself verify for you the fastest suitable gateways from the Public Gateways list provided by Protocol Labs.

Once you have successfully connected to at least 3 of them, the content will show up automatically.

This component will help to fetch media from IPFS without needing to set or configure any gateway, no need for pass correct CID as parameter. It grabs the data directly from the fastest responding Gateways. In case it failed to fetch data from the gateways multiple time, this source will be removed from the list and another one will take it's place. 

The service to fetch Images and JSON(Metadata) files work decoupling the URL/CID/Path passed ad check if is a valid IPFS link. In case of succeded fetch for CID and subpaths, it uses the better gateway possible to fetch content. In case of succeded feching from one of the best gateways it returns immediatelly. Otherwise it will fallback to the URL previously passed.

[Live Demo Vue](https://filipesoccol.github.io/vue-ipfs-components-demo/) / [Live Demo Repo Vue](https://github.com/filipesoccol/vue-ipfs-components-demo)

## Sources for media supported includes:

- [x] Path with CIDv0 only: Qm...
- [x] Path with CIDv1 only: bafy...
- [x] IPFS protocol path: ipfs://...
- [x] Pre-filled IPFS gateway path: https://ipfs.io/ipfs/...
- [x] CIDv1 with subdomain path: https://bafy.../2.png
- [x] Non IPFS URLs (Will fetch url itself.)

## Roadmap to Beta
- [x] Only uses gateways path to fetch content (CidV1)
- [ ] Convert any CIDv0 to V1 and fethc using subdomains 
- [ ] Improve conditions to consider IPFS connected
- [ ] Improve conditions to discard a connected gateway

## Installation

First install package on your project:
```bash
npm install -s ipfs-public-fetcher
```

Then use package as you want:
```js
import {Initialize, FetchJSON, FetchContent, IsConnected} from 'ipfs-public-fetcher'
```

## Usage

First is needed to initialze the package to connect peers:

**Initialize(customDomains)**: The initializer function to fetch domains. It is possible to select custom domains to fetch from just passing a js file that contains an array of strings. By default the module prevent app from initialize multiple times to prevent spam in hot-reloads. If you want to force it to re-initialize use 

- forceInitialize: The module will not initialize twice unless you force it.
- verbose: Show additional logs for connection/fetch content
- customDomains: A object or module containing a list of domains.
```ts
const customDomains = [
  "https://ipfs.io/ipfs/:hash",
	"https://dweb.link/ipfs/:hash",
]

Initialize({customDomains})
```

After that, we feature two different ways to fetch data:

**FetchJSON(cid)**: A function to grab a JSON file from IPFS from fastest public gateway. Return a valid Object related to JSON fetched.

- cid: A valid IPFS cid or IPFS path. 
```ts
const json = await FetchJSON('bafybe...sk3m')
```

**FetchContent(cid)**: A function to grab general content/media. It returns a valid path to render on content tags.

- cid: A valid IPFS cid or IPFS path. 
```ts
const contentPath = await FetchContent('bafybe...sk3m')
```

**IsConnected()**: A function to verify connection at any moment.
```ts
const connected = IsConnected()
```

## References:

- Protocol-Labs public gateway list: [Website](https://ipfs.github.io/public-gateway-checker/) / [Repo](https://github.com/ipfs/public-gateway-checker/blob/master/src/gateways.json)

- Consensys article related to Gateways security: [Link](https://consensys.net/diligence/blog/2021/06/ipfs-gateway-security/)