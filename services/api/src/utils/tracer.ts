import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { getRequestId } from '../middleware/request-id.middleware';

const tracer = trace.getTracer('telegram-clicker-api');

export function startSpan(name: string, attributes?: Record<string, any>) {
  const span = tracer.startSpan(name);
  
  // Add request ID if available
  const requestId = getRequestId();
  if (requestId !== 'n/a') {
    span.setAttribute('request.id', requestId);
  }
  
  // Add custom attributes
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
  
  return span;
}

export function endSpan(span: any, error?: Error) {
  if (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  } else {
    span.setStatus({ code: SpanStatusCode.OK });
  }
  
  span.end();
}

export function runInSpan<T>(name: string, fn: () => T, attributes?: Record<string, any>): T {
  const span = startSpan(name, attributes);
  
  try {
    const result = context.with(trace.setSpan(context.active(), span), fn);
    endSpan(span);
    return result;
  } catch (error) {
    endSpan(span, error as Error);
    throw error;
  }
}

export async function runInSpanAsync<T>(
  name: string, 
  fn: () => Promise<T>, 
  attributes?: Record<string, any>
): Promise<T> {
  const span = startSpan(name, attributes);
  
  try {
    const result = await context.with(trace.setSpan(context.active(), span), fn);
    endSpan(span);
    return result;
  } catch (error) {
    endSpan(span, error as Error);
    throw error;
  }
}

export { tracer };
