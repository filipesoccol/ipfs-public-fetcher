# IPFS Public Fetcher
![vue-ipfs-components-logo](https://bafybeih2qkxommebznq6zavgqltidbmszz5j6tssoq75coj2yjg554mldm.ipfs.w3s.link/ipfs.png)

### Load any IPFS content from the fastest gateway available just passing a valid path.

The component itself verify for you the fastest suitable gateways from the Public Gateways list provided by Protocol Labs.

Once you have successfully connected to at least 3 of them, the content will show up automatically.

This component will help to fetch media from IPFS without needing to set or configure any gateway, no need for pass correct CID as parameter. It grabs the data directly from the fastest responding Gateways. In case it failed to fetch data from the gateways multiple time, this source will be removed from the list and another one will take it's place. 

The service to fetch Images and JSON(Metadata) files work decoupling the URL/CID/Path passed ad check if is a valid IPFS link. In case of succeded fetch for CID and subpaths, it uses the better gateway possible to fetch content. In case of succeded feching from one of the best gateways it returns immediatelly. Otherwise it will fallback to the URL previously passed.

[Live Demo Vue](https://filipesoccol.github.io/vue-ipfs-components-demo/) / [Live Demo Repo Vue](https://github.com/filipesoccol/vue-ipfs-components-demo)

## Sources for media supported includes:

[x] Path with CIDv0 only: Qm...
[x] Path with CIDv1 only: bafy...
[x] IPFS protocol path: ipfs://...
[x] Pre-filled IPFS gateway path: https://ipfs.io/ipfs/...
[x] CIDv1 with subdomain path: https://bafy.../2.png
[x] Non IPFS URLs (Will fetch url itself.)

## Installation

First install package on your project:
```
npm install -s ipfs-public-fetcher
```

Then use package as you want:
```
import IPFSFetcher from 'ipfs-public-fetcher'
```

## Usage

First is needed to initialze the package to connect peers:

**Initialize(customDomains)**: The initializer function to fetch domains. It is possible to select custom domains to fetch from just passing a js file that contains an array of strings. 

- customDomains: A object or module containing a list of domains.
```
const domains = [
    "https://ipfs.io/ipfs/:hash",
	"https://dweb.link/ipfs/:hash",
]

IPFSFetcher.Initialize(domains)
```

After that, we feature two different ways to fetch data:

**FetchJSON(cid)**: A function to grab a JSON file from IPFS from fastest public gateway. Return a valid Object related to JSON fetched.

- cid: A valid IPFS cid or IPFS path. 
```
const json = await IPFSFetcher.FetchJSON('bafybe...sk3m')
```

**FetchContent(cid)**: A function to grab general content/media. It returns a valid path to render on content tags.

- cid: A valid IPFS cid or IPFS path. 
```
const contentPath = await IPFSFetcher.FetchContent('bafybe...sk3m')
```

## References:

- Protocol-Labs public gateway list: [Website](https://ipfs.github.io/public-gateway-checker/) / [Repo](https://github.com/ipfs/public-gateway-checker/blob/master/src/gateways.json)