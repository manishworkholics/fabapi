import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * IngestionExceptionFilter
 * 
 * Global exception filter for ingestion-related errors.
 * Provides safe, consistent error responses without exposing sensitive information.
 * 
 * Features:
 * - Logs detailed errors server-side
 * - Returns sanitized error messages to clients
 * - Handles both HTTP exceptions and unexpected errors
 */
@Catch()
export class IngestionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(IngestionExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let error = 'Internal Server Error';

    // Log the full error for debugging
    if (exception instanceof Error) {
      this.logger.error(
        `Exception in ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    // Handle HTTP exceptions (NestJS built-in)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        error = responseObj.error || error;
      }
    }
    // Handle AWS SDK errors
    else if (this.isAwsError(exception)) {
      status = this.mapAwsErrorToHttpStatus(exception as any);
      message = this.sanitizeAwsError(exception as any);
      error = 'AWS Service Error';
    }
    // Handle Prisma errors
    else if (this.isPrismaError(exception)) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      error = 'Database Error';
      this.logger.error(`Prisma error: ${JSON.stringify(exception)}`);
    }
    // Handle validation errors
    else if (exception instanceof Error) {
      // Check for specific error types
      if (exception.message.includes('File size exceeds')) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        message = exception.message;
        error = 'Payload Too Large';
      } else if (exception.message.includes('Invalid content type')) {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
        error = 'Bad Request';
      } else if (exception.message.includes('not found')) {
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        error = 'Not Found';
      } else {
        // Generic error - don't expose internal details
        message = 'An error occurred while processing your request';
      }
    }

    // Send error response
    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  /**
   * Check if error is from AWS SDK
   */
  private isAwsError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      ('$metadata' in exception || '$fault' in exception)
    );
  }

  /**
   * Check if error is from Prisma
   */
  private isPrismaError(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      (exception as any).code.startsWith('P')
    );
  }

  /**
   * Map AWS SDK errors to appropriate HTTP status codes
   */
  private mapAwsErrorToHttpStatus(error: any): number {
    const errorName = error.name || '';

    if (errorName.includes('NotFound') || errorName.includes('NoSuch')) {
      return HttpStatus.NOT_FOUND;
    }
    if (errorName.includes('AccessDenied') || errorName.includes('Forbidden')) {
      return HttpStatus.FORBIDDEN;
    }
    if (errorName.includes('InvalidParameter') || errorName.includes('Validation')) {
      return HttpStatus.BAD_REQUEST;
    }
    if (errorName.includes('ServiceUnavailable') || errorName.includes('Throttling')) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Sanitize AWS errors to avoid exposing sensitive information
   */
  private sanitizeAwsError(error: any): string {
    const errorName = error.name || '';

    if (errorName.includes('NotFound') || errorName.includes('NoSuch')) {
      return 'The requested resource was not found';
    }
    if (errorName.includes('AccessDenied')) {
      return 'Access denied to the requested resource';
    }
    if (errorName.includes('InvalidParameter')) {
      return 'Invalid parameters provided';
    }
    if (errorName.includes('ServiceUnavailable')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    if (errorName.includes('Throttling')) {
      return 'Too many requests. Please try again later.';
    }

    // Generic AWS error - don't expose details
    return 'An error occurred while accessing cloud storage';
  }
}

