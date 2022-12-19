import * as isIPFS from 'is-ipfs';
import sourceDomains from './domains.js'

// List of gateways that successfully responded
let gatewaysFetched = []
// True when sucessfully connected with at least two gateways
let ipfsConnected = false

export const Initialize = (customDomains) => {
    gatewaysFetched = []
    ipfsConnected = false
    console.log('-- IPFS Starting connection process --');
    const domains = customDomains ? customDomains : sourceDomains
    domains.forEach( gatewayPath => {
        const dateBefore = Date.now()
        // Test each gateway against a 5sec timeout
        Promise.race([
            fetch(gatewayPath.replace(':hash', 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m'), {timeout:500, mode:'cors'}),
            new Promise( (resolve, reject) => { setTimeout(reject, 5000) })
        ]).then( (response) => {
            if (response.ok) {
                return response.text();
            } else {
                throw Error(response.statusText);
            }
        })
        .then( () => {
            // Concat the new fetched gateway and make a fester response sort
            gatewaysFetched = gatewaysFetched.concat({path: gatewayPath, errors:0, response:Date.now() - dateBefore})
            .sort((a,b) => a.response - b.response)
            console.log('Gateway connected: ', gatewayPath)
            // If more than 3 gateways have succeded, then consider IPFS connected and ready
            if (gatewaysFetched.length > 3 && !ipfsConnected) {
                console.log('-- IPFS Connected to enough gateways --')
                ipfsConnected = true
            }
        })
        .catch( (err) => {
            console.log('Failed to fetch gateway.')
        })
    })
}

const digestPath = (url) => {
    let path = ''
    try {
        // Try to geth only the pathname for the URL
        const urlObject = new URL(url);

        // If is a IPFS protocol address
        // ipfs://QmXNwZhBAG9Pw9nBAHGrKMe56U6Vz9K7SxX4Tbcksp6Fsn/121.gif
        if (urlObject.protocol == 'ipfs:') {
            path = url.substring(7)
            // If it is a base32 subdomain path
            // https://bafy...betwe.ipfs.w3s.link/121.gif
        } else if (isIPFS.base32cid(urlObject.host.split('.')[0])) {
            path = urlObject.host.split('.')[0] + urlObject.pathname
        } else {
            // Or in case of a simple gateway, remove the gateway part.
            path = urlObject.pathname
        }
    } catch { 
        // Not a full URL
        path = url
    }

    // https://github.com/ipfs-shipyard/is-ipfs
    // In case of a path starting with /ipfs/Qm.... remove the /ipfs
    if (isIPFS.ipfsPath(path)) return path.substring(6)
    // In case of a path containing only the cid+subpath
    if (isIPFS.cidPath(path)) return path
    // In case of cid
    if (isIPFS.cid(path)) return path
    // In case of none of the above, fail.

    throw new Error('Not a valid IPFS URL')
}

const persistentFetch = async (digested, path) => {
    let tries = 0;
    let found = undefined;
    while(!found && tries < 20){
        // Controls Fetch for abort in case of failure or success
        const controllers = [
            new AbortController(),
            new AbortController(),
            new AbortController(),
            new AbortController()
        ];
        // Se a timeout for retry
        let timeout
        // Racing the promises for tries
        await Promise.race(
            // Grab the first 3 best gateways
            gatewaysFetched.slice(0,2).map( (gateway, idx) => {
                // Try grab the content from one of the gateways
                return resolvePath(gateway, digested, controllers, idx)
            })
            // .concat(() => {
            //     // Concat the Path itself as a fallback
            //     return resolvePath(null, path, controllers, 3)
            // })
            .concat(new Promise((resolve) => {
                // Concat a timeout promise in case any of the previous resolves correctly
                timeout = setTimeout(() => resolve(), 5000)
            }))
        ).then( (res) => {
            // Start clearing the timeout
            clearTimeout(timeout);
            // Then abort each one of the controllers except for the sucessfull index
            controllers.forEach( (c, idx) => { 
                if(idx != res.idx) c.abort()
            })
            // In case of a successful returned result, set found variable
            if (res) found = res.value;
        }).catch(() => {
            clearTimeout(timeout);
            controllers.forEach( (c) => c.abort())
        })
        if (!found){
            // In case of nothing found. Try again and increase the counter
            tries ++
            if (tries >= 20) console.error('Stopped try to fetch', path)
        }
    }
    // In case of successful found a resource, return it.
    if (found) return found
    // IN case of a non successful fetch after 20 tries, return original path
    return path
}

const resolvePath = (gateway, digested, controllers, idx) => {
    return new Promise( (resolve,reject) => {
        // Fetch digested path from best gateways
        const gatewayPath = gateway ? gateway.path.replace(':hash', digested) : digested
        fetch(gatewayPath, {signal: controllers[idx].signal})
        .then( (r) => {
            // If fetched return as soon as possible
            if (r.ok) {
                resolve({value: gateway.path.replace(':hash', digested), idx})
                return
            }
            throw new Error('Error fetching content')
        })
        .catch( (err) => {
            if (gateway && err.code && err.code != 20){
                gateway.errors++
                if (gateway.errors > 3) gatewaysFetched.splice(gatewaysFetched.indexOf(gateway), 1)
            }
            reject()
        })
    })
}

// Wait for gateway connections before try fetch any content 
const waitLoop = (callback) => {
    // If connected return
    if (ipfsConnected) {
        callback()
        return
    }
    // Try again if not connected.
    setTimeout(() => {
        waitLoop(callback)
    }, 100)
}

// Fetch a JSON documnet from fastest IPFS gateways connected
export const FetchJSON = async (path) => {
    let digested = ''
    // Try to grab IPFS Cid from 
    try { digested = digestPath(path) }
    catch (err) {
        console.error(err)
        // In case of fail to digest use same path to fetch
        return new Promise( (resolve) => {
            fetch(path)
            .then( (r) => r.json())
            .then( doc => resolve(doc))
        })
    }
    // Before fetch wait for gateway connections
    await new Promise( resolve => { waitLoop(resolve) })
    // Try repeatedly to fetch for document on multiple gateways
    const newPath = await persistentFetch(digested, path)
    return new Promise( (resolve) => {
        fetch(newPath)
        .then( (r) => r.json())
        .then( doc => resolve(doc))
    })
}

export const FetchContent = async (path) => {
    let digested = ''
    try { digested = digestPath(path) }
    catch {
        // In case of fail to digest use same path to fetch
        console.log('Not an IPFS valid path:', path)
        return path
    }
    // Wait connection to be completed before try to fetch 
    await new Promise( resolve => { waitLoop(resolve) })
    return await persistentFetch(digested, path, 'path')
}