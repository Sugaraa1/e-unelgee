import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exRes = exception.getResponse();
    const error = typeof exRes === 'string' ? { message: exRes } : (exRes as any);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) this.logger.error(`${req.method} ${req.url}`, exception.stack);
    res.status(status).json({ success: false, statusCode: status, timestamp: new Date().toISOString(), path: req.url, ...error });
  }
}
