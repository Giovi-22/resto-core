import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => {
        // Si el data ya tiene forma { data, meta }, lo dejamos pasar sin envolver
        if (
          data !== null &&
          typeof data === 'object' &&
          'data' in (data as object)
        ) {
          return data as unknown as ApiResponse<T>;
        }
        return { data };
      }),
    );
  }
}

