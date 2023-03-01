
export type IPFSFetcherOptions = {
    customDomains?: string[],     // Array of gateays to replace the default gateways from plugin
    verbose?: boolean        // Log consoles 
    forceInitialize?: boolean  // Force initialize even on hot realoads
}

export type IPFSGateway = {
    path: string,       // URI path to be used to fetch content
    errors: number,     // How much errors this gateway has returned
    response: number,   // Time in MS that gateway takes to respond 
}