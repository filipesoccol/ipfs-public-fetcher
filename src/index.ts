import sourceDomains from './domains'
import * as Utilities from './utilities'
import {
    IPFSFetcherOptions,
    IPFSGateway
} from './types'

let instance:IPFSFetcher|undefined = undefined;

export const Initialize = async (options: IPFSFetcherOptions) => {
    instance = new IPFSFetcher(options);
}

// Wait for gateway connections before try fetch any content 
const waitLoop = (callback: (value?: unknown) => void) => {
    // If connected return
    if (instance?.ipfsConnected) {
        callback()
        return
    }
    // Try again if not connected.
    setTimeout(() => {
        if (instance) waitLoop(callback)
    }, 100)
}

class IPFSFetcher { 

    // List of gateways that successfully responded
    gatewaysFetched:IPFSGateway[]
    // True when sucessfully connected with at least two gateways
    ipfsConnected = false
    // True when verbosity is enabled to check errors
    verbose = false

    constructor(options: IPFSFetcherOptions) {
        this.gatewaysFetched = []
        if (options?.verbose) this.verbose = true;
        if (this.verbose) console.log('-- IPFS Starting connection process --');
        const domains = options?.customDomains ? options.customDomains : sourceDomains
        domains.forEach( gatewayPath => {
            const dateBefore = Date.now()
            // Test each gateway against a 5sec timeout
            Promise.any([
                fetch(gatewayPath.replace(':hash', 'bafybeifx7yeb55armcsxwwitkymga5xf53dxiarykms3ygqic223w5sk3m'), {mode: 'cors', method:'HEAD'}),
                new Promise( (resolve, reject) => { setTimeout(reject, 5000) })
            ]).then( (response:Response) => {
                if (
                    // Fetch returned successfully
                    response.ok
                    // In case of customDomains IPFSSubdomain security verification is disabled
                    // TODO This line was commented due to apparently there are not so much public domains that uses subdomains
                    // customDomains ? true : isIPFS.ipfsSubdomain(response.url)
                ) {
                    return;
                } else {
                    throw Error(response.statusText);
                }
            })
            .then( () => {
                // Concat the new fetched gateway and make a fester response sort
                this.gatewaysFetched = this.gatewaysFetched.concat({path: gatewayPath, errors:0, response:Date.now() - dateBefore})
                .sort((a,b) => a.response - b.response)
                if (this.verbose) console.log('Gateway connected: ',this.gatewaysFetched.length,'-', gatewayPath,)
                // If more than 3 gateways have succeded, then consider IPFS connected and ready
                if (this.gatewaysFetched.length > 1 && !this.ipfsConnected) {
                    if (this.verbose) console.log('-- IPFS Connected to enough gateways --')
                    this.ipfsConnected = true
                }
            })
            .catch( (err) => {
                if (this.verbose) console.log('Failed to fetch gateway or Path based Gateway', gatewayPath)
            })
        })
    }
}

// Try to fetch a content to via gateway path
class PathResolver {

    controller:AbortController;
    signal:AbortSignal;
    gateway:IPFSGateway;
    gatewayPath:string;

    constructor (digested: string, gateway?:IPFSGateway) {
        this.controller = new AbortController();
        this.signal = this.controller.signal
        this.gatewayPath = gateway ? gateway.path.replace(':hash', digested) : digested
    }

    async fetch () {
        return new Promise<string>( (resolve,reject) => {
            // Fetch digested path from best gateways
            fetch(this.gatewayPath, {method: 'HEAD'})
            .then( (r) => {
                // If fetched return as soon as possible
                if (r.ok) {
                    resolve(this.gatewayPath)
                    return
                }
                throw new Error('Error fetching content')
            })
            .catch( (err:any) => {
                if (err.name === 'AbortError') {
                    // console.log('Aborted request', this.gateway.path)
                } else if (this.gateway && err.code && err.code != 20){
                    this.gateway.errors++
                }
                reject()
            })
        })
    }

    // Kill resolver in case of other fetched faster or timeout
    kill(){
        this.controller.abort()
    }
}

class PersistentFetcher {

    // Will be use to kill/abort fetch request that could still be alive
    resolvers:PathResolver[]
    // A string containing a CID and maybe a Subpath togheter
    digested: string
    // The raw path for request in case everything fails
    originalPath: string
    // How many tries
    tries: number
    // Item found!
    found: null | string

    constructor (digested:string, originalPath:string) {
        this.digested = digested;
        this.originalPath = originalPath;
        this.resolvers = []
    }

    // Try persistently to fetch 
    async fetch () {
        this.tries = 0;
        this.found = undefined;
        while(!this.found && this.tries < 5){
            // Se a timeout reference for clear it at the end
            let timeout
            // Racing the promises for tries
            await Promise.any(
                // Grab the first 3 best gateways not errored
                instance.gatewaysFetched
                .filter((g) => g.errors < 8)
                .slice(0,3).map( (gateway) => {
                    // Try grab the content from one of the gateways
                    const resolver = new PathResolver(this.digested, gateway);
                    this.resolvers.push(resolver);
                    return resolver.fetch();
                })
                .concat(new Promise<null>((resolve) => {
                    // Concat a timeout promise in case any of the previous resolves correctly
                    timeout = setTimeout(() => {
                        resolve(null)
                    }, 1000)
                }))
            ).then( (res:null | string) => {
                // Start clearing the timeout
                this.resolvers.forEach((r) => r.kill())
                clearTimeout(timeout);
                // In case of a successful returned result, set found variable
                if (res) this.found = res;
            }).catch(() => {
                clearTimeout(timeout);
            })
            if (!this.found){
                // In case of nothing found. Try again and increase the counter
                this.tries ++
                clearTimeout(timeout);
                this.resolvers.forEach((r) => r.kill())
                this.resolvers = []
            }
        }
        // In case of successful found a resource, return it.
        if (this.found) return this.found
        // In case of a non successful fetch after 20 tries, return original path
        return this.originalPath
    }
}


// Fetch fastest IPFS gateway url for the desired content 
export const FetchContent = async (path:string) => {
    let digested = Utilities.digestPath(path)
    if (!digested.isIPFS){
        // In case of fail to digest use same path to fetch
        console.log('Not an IPFS valid path:', path)
        return path
    }
    // Wait connection to be completed before try to fetch 
    await new Promise( resolve => { waitLoop(resolve) })
    const fetcher = new PersistentFetcher(digested.cid+digested.subpath, path)
    return fetcher.fetch()
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