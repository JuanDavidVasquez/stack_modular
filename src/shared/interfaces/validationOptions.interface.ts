type ValidationTarget = 'body' | 'query' | 'params';

export interface ValidationOptions {
    target?: ValidationTarget | ValidationTarget[];
    stripUnknown?: boolean;
}
