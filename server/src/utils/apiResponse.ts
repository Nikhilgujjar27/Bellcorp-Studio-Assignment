import { Response } from 'express';

export interface ApiResponseData<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiResponse {
  static success<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) {
    const responseBody: ApiResponseData<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(responseBody);
  }

  static error(res: Response, message: string, errorCode: string = 'INTERNAL_ERROR', statusCode: number = 500, details?: any) {
    const responseBody: ApiResponseData = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details ? { details } : {}),
      },
    };
    return res.status(statusCode).json(responseBody);
  }
}
