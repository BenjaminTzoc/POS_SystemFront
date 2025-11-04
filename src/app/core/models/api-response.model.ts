export interface ApiResponse<T = any> {
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
    path: string;
}