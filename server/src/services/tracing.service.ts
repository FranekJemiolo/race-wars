/**
 * Distributed Tracing Service
 * 
 * Handles distributed tracing using OpenTelemetry:
 * - Span creation and management
 * - Context propagation
 * - Trace export
 * - Instrumentation for HTTP, WebSocket, Database
 */

// @ts-ignore - OpenTelemetry types will be available after npm install
import { trace, context, Span, SpanStatusCode, SpanKind, Tracer } from '@opentelemetry/api';
// @ts-ignore
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
// @ts-ignore
import { Resource } from '@opentelemetry/resources';
// @ts-ignore
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
// @ts-ignore
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
// @ts-ignore
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

export interface TracingConfig {
  serviceName: string;
  jaegerEndpoint?: string;
  sampleRate?: number;
}

const DEFAULT_CONFIG: TracingConfig = {
  serviceName: 'race-wars-server',
  jaegerEndpoint: 'http://localhost:14268/api/traces',
  sampleRate: 1.0,
};

export class TracingService {
  private config: TracingConfig;
  private tracer: Tracer | null = null;
  private isInitialized = false;

  constructor(config?: TracingConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize tracing
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const resource = Resource.default().merge(
        new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
          [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        })
      );

      const provider = new NodeTracerProvider({
        resource,
      });

      // Add Jaeger exporter if endpoint is configured
      if (this.config.jaegerEndpoint) {
        const exporter = new JaegerExporter({
          endpoint: this.config.jaegerEndpoint,
        });
        provider.addSpanProcessor(new BatchSpanProcessor(exporter));
      }

      provider.register();

      this.tracer = trace.getTracer(this.config.serviceName);
      this.isInitialized = true;
      console.log('Distributed tracing initialized');
    } catch (error) {
      console.error('Failed to initialize tracing:', error);
    }
  }

  /**
   * Shutdown tracing
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // @ts-ignore
      const provider = trace.getTracerProvider();
      if (provider && typeof (provider as any).shutdown === 'function') {
        await (provider as any).shutdown();
      }
      this.isInitialized = false;
      console.log('Distributed tracing shutdown');
    } catch (error) {
      console.error('Failed to shutdown tracing:', error);
    }
  }

  /**
   * Start a span
   */
  startSpan(name: string, options?: {
    kind?: SpanKind;
    attributes?: Record<string, any>;
    parentSpan?: Span;
  }): Span | null {
    if (!this.tracer || !this.isInitialized) {
      return null;
    }

    try {
      const spanOptions: any = {
        kind: options?.kind || SpanKind.INTERNAL,
        attributes: options?.attributes,
      };

      if (options?.parentSpan) {
        // @ts-ignore - Context API compatibility
        return this.tracer.startSpan(name, spanOptions, (context as any).setSpan(context.active(), options.parentSpan));
      }

      return this.tracer.startSpan(name, spanOptions);
    } catch (error) {
      console.error('Failed to start span:', error);
      return null;
    }
  }

  /**
   * Start an HTTP span
   */
  startHttpSpan(method: string, url: string): Span | null {
    return this.startSpan(`HTTP ${method}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': method,
        'http.url': url,
        'http.scheme': 'http',
      },
    });
  }

  /**
   * Start a database span
   */
  startDbSpan(operation: string, table: string): Span | null {
    return this.startSpan(`DB ${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.operation': operation,
        'db.name': table,
      },
    });
  }

  /**
   * Start a WebSocket span
   */
  startWebSocketSpan(messageType: string): Span | null {
    return this.startSpan(`WebSocket ${messageType}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'messaging.system': 'websocket',
        'messaging.message.type': messageType,
      },
    });
  }

  /**
   * End a span
   */
  endSpan(span: Span | null, error?: Error): void {
    if (!span) return;

    try {
      if (error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      span.end();
    } catch (err) {
      console.error('Failed to end span:', err);
    }
  }

  /**
   * Run a function within a span
   */
  async runInSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
    }
  ): Promise<T> {
    const span = this.startSpan(name, options);
    if (!span) {
      return await fn(null as any);
    }

    try {
      const result = await fn(span);
      this.endSpan(span);
      return result;
    } catch (error) {
      this.endSpan(span, error as Error);
      throw error;
    }
  }

  /**
   * Add an event to a span
   */
  addEvent(span: Span | null, name: string, attributes?: Record<string, any>): void {
    if (!span) return;

    try {
      span.addEvent(name, attributes);
    } catch (error) {
      console.error('Failed to add event to span:', error);
    }
  }

  /**
   * Set an attribute on a span
   */
  setAttribute(span: Span | null, key: string, value: any): void {
    if (!span) return;

    try {
      span.setAttribute(key, value);
    } catch (error) {
      console.error('Failed to set attribute on span:', error);
    }
  }

  /**
   * Get the current span
   */
  getCurrentSpan(): Span | null {
    try {
      const span = trace.getSpan(context.active());
      return span || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Wrap an async function with tracing
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    spanName: string,
    options?: {
      kind?: SpanKind;
      attributes?: Record<string, any>;
    }
  ): T {
    return (async (...args: any[]) => {
      return await this.runInSpan(spanName, async (span) => {
        if (span) {
          // Add function arguments as attributes if span exists
          if (args.length > 0) {
            this.setAttribute(span, 'args.count', args.length);
          }
        }
        return await fn(...args);
      }, options);
    }) as T;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TracingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): TracingConfig {
    return { ...this.config };
  }

  /**
   * Check if initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let tracingService: TracingService | null = null;

export function getTracingService(config?: TracingConfig): TracingService {
  if (!tracingService) {
    tracingService = new TracingService(config);
  }
  return tracingService;
}

export function resetTracingService(): void {
  if (tracingService) {
    tracingService = null;
  }
}
