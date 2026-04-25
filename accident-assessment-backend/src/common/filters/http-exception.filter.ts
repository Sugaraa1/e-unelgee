import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exRes = exception.getResponse();
      if (typeof exRes === 'string') {
        message = exRes;
      } else if (typeof exRes === 'object' && exRes !== null) {
        const r = exRes as any;
        message = r.message ?? message;
        error = r.error ?? error;
      }
    } else if (exception instanceof QueryFailedError) {
      // FIX: Handle DB constraint violations gracefully
      status = HttpStatus.CONFLICT;
      const dbError = exception as any;

      if (dbError.code === '23505') {
        // unique_violation
        message = 'Давтагдсан өгөгдөл байна. Дахин оролдоно уу.';
        error = 'Conflict';
      } else if (dbError.code === '23503') {
        // foreign_key_violation
        message = 'Холбоотой өгөгдөл олдсонгүй.';
        error = 'Bad Request';
        status = HttpStatus.BAD_REQUEST;
      } else {
        // Hide DB internals in production
        message = this.isProduction
          ? 'Өгөгдлийн сантай холбогдоход алдаа гарлаа.'
          : exception.message;
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    } else if (exception instanceof Error) {
      message = this.isProduction ? 'Internal server error' : exception.message;
    }

    // Log 5xx errors
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${req.method} ${req.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(`${req.method} ${req.url} → ${status}: ${JSON.stringify(message)}`);
    }

    res.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      error,
      message,
    });
  }
}
