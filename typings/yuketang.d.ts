export namespace request {
    export function get(url: string, params?: object, headers?: object): Promise<any>;
    export function post(url: string, data: object, headers?: object): Promise<any>;
}
