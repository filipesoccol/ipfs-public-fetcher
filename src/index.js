import * as isIPFS from 'is-ipfs';
import sourceDomains from './domains.js'
import * as Utilities from './utilities'

// List of gateways that successfully responded
let gatewaysFetched = []
// True when sucessfully connected with at least two gateways
let ipfsConnected = false

export const Initialize = async (customDomains, verbose) => {
    gatewaysFetched = []
    //verbose = true
    ipfsConnected = false
    if (verbose) console.log('-- IPFS Starting connection process --');
    const domains = customDomains ? customDomains : sourceDomains
    domains.forEach( gatewayPath => {
        const dateBefore = Date.now()
        // Test each gateway against a 5sec timeout
        Promise.any([
            fetch(gatewayPath.replace(':hash', 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m'), {timeout:5000, method:'HEAD'}),
            new Promise( (resolve, reject) => { setTimeout(reject, 5000) })
        ]).then( (response) => {
            // Only accept Subdomain paths 
            //response.body.text().then(res => console.log)
            if (
                // Fethc returned successfully
                response.ok &&
                // In case of customDomains IPFSSubdomain security verification is disabled
                customDomains ? true : isIPFS.ipfsSubdomain(response.url)
            ) {
                return;
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
                if (verbose) console.log('-- IPFS Connected to enough gateways --')
                ipfsConnected = true
            }
        })
        .catch( (err) => {
            if (verbose) console.log('Failed to fetch gateway or Path based Gateway')
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

const persistentFetch = async (digested, path) => {
    let tries = 0;
    let found = undefined;
    while(!found && tries < 20){
        // Se a timeout for retry
        let timeout
        // Racing the promises for tries
        await Promise.any(
            // Grab the first 3 best gateways
            gatewaysFetched.slice(0,3).map( (gateway, idx) => {
                // Try grab the content from one of the gateways
                return resolvePath(gateway, digested, idx)
            })
            .concat(new Promise((resolve) => {
                // Concat a timeout promise in case any of the previous resolves correctly
                timeout = setTimeout(() => resolve(), 5000)
            }))
        ).then( (res) => {
            // Start clearing the timeout
            clearTimeout(timeout);
            // In case of a successful returned result, set found variable
            if (res) found = res.value;
        }).catch(() => {
            clearTimeout(timeout);
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

const resolvePath = (gateway, digested, idx) => {
    return new Promise( (resolve,reject) => {
        // Fetch digested path from best gateways
        const gatewayPath = gateway ? gateway.path.replace(':hash', digested) : digested
        fetch(gatewayPath, {method: 'HEAD'})
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

// Fetch fastest IPFS gateway url for the desired content 
export const FetchContent = async (path) => {
    let digested = Utilities.digestPath(path)
    if (!digested.isIPFS){
        // In case of fail to digest use same path to fetch
        console.log('Not an IPFS valid path:', path)
        return path
    }
    // Wait connection to be completed before try to fetch 
    await new Promise( resolve => { waitLoop(resolve) })
    return await persistentFetch(digested.cid+digested.subpath, path)
}

// Fetch a JSON formatted doc from fastest IPFS gateways connected
export const FetchJSON = async (path) => {
    const newPath = await FetchContent(path)
    return new Promise( (resolve) => {
        fetch(newPath)
        .then( (r) => r.json())
        .then( doc => resolve(doc))
    })
}