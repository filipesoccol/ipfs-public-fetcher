export type IPFSFetcherOptions = {
    customDomains?: string[];
    verbose?: boolean;
    forceInitialize?: boolean;
};
export type IPFSGateway = {
    path: string;
    errors: number;
    response: number;
};
