import { Observable, catchError, map, of, startWith } from 'rxjs';
import { ApiRequestError } from '@services/api.service';

export type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: 'notFound' | 'failed' | null;
};

export function resourceState<T>(request: Observable<T>): Observable<ResourceState<T>> {
  return request.pipe(
    map((data): ResourceState<T> => ({ data, loading: false, error: null })),
    catchError((error) =>
      of<ResourceState<T>>({
        data: null,
        loading: false,
        error: error instanceof ApiRequestError && error.status === 404 ? 'notFound' : 'failed',
      }),
    ),
    startWith({ data: null, loading: true, error: null } as ResourceState<T>),
  );
}
