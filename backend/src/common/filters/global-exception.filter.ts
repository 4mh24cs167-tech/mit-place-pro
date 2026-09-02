import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = 
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log the error natively
    if (status >= 500) {
      this.logger.error(
        \\ \ - \\,
      );
    } else {
      this.logger.warn(\\ \ - Status: \ - \\);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' && message !== null && 'message' in message 
        ? (message as any).message 
        : message,
    });
  }
}

