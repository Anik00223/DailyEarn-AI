export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  code: string;
  message: string;
}

export function success<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

export function error(code: string, message: string): ErrorResponse {
  return {
    success: false,
    code,
    message,
  };
}
