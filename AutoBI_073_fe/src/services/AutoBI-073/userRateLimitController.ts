// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** showAvailableRequests GET /api/user_rate_limit/show-available */
export async function showAvailableRequestsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseUserLimitVO_>('/api/user_rate_limit/show-available', {
    method: 'GET',
    ...(options || {}),
  });
}
