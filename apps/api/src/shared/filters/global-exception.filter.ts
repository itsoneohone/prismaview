import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

/**
 * Global exception filter that catches all unhandled exceptions across the application.
 *
 * This filter provides a centralized way to handle exceptions and transform them into
 * consistent HTTP responses. It can optionally use an ExceptionTransformer function
 * to convert specific exceptions (like Prisma errors) into standardized HttpException
 * objects before sending the response to the client.
 *
 * The filter ensures all exceptions are properly formatted with appropriate HTTP status
 * codes and response structures, maintaining consistency across the API.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly ExceptionTransformer?: (exception: any) => HttpException,
  ) {}
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Transform exception if transformer is provided, otherwise use as-is
    const transformedException = this.ExceptionTransformer
      ? this.ExceptionTransformer(exception)
      : exception;

    const status = transformedException.getStatus();

    response.status(status).json({
      ...transformedException.getResponse(),
    });
  }
}
