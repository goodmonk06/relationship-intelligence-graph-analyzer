/**
 * Tests for error handling
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  formatErrorResponse,
  ErrorCode,
} from './errors';

describe('Error Classes', () => {
  it('should create ValidationError with correct properties', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create NotFoundError with resource name', () => {
    const error = new NotFoundError('Entity', '123');

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.message).toContain('Entity');
    expect(error.message).toContain('123');
  });

  it('should create ConflictError', () => {
    const error = new ConflictError('Resource already exists');

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(ErrorCode.CONFLICT);
    expect(error.statusCode).toBe(409);
  });

  it('should format error response correctly', () => {
    const error = new ValidationError('Test error', { test: true });
    const response = formatErrorResponse(error);

    expect(response.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(response.error.message).toBe('Test error');
    expect(response.error.details).toEqual({ test: true });
    expect(response.error.timestamp).toBeDefined();
    expect(new Date(response.error.timestamp)).toBeInstanceOf(Date);
  });
});
