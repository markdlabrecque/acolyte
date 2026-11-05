import type { Config } from '../config.ts';
import type { Receipt } from './documents.ts';

export function effectiveLimit(request: Receipt, config: Config, key: keyof Config['limits']) {
  return Math.min(request.config.limits[key], config.limits[key]);
}

export function remainingActiveMs(request: Receipt, config: Config = request.config) {
  const remaining = effectiveLimit(request, config, 'activeMs') - (Date.now() - request.startedAt);
  if (remaining <= 0) throw new Error('Active work limit exhausted');
  return remaining;
}

export function countCall(request: Receipt, config: Config, kind: 'modelCalls' | 'toolCalls') {
  if (request[kind] >= effectiveLimit(request, config, kind)) {
    throw new Error(`${kind === 'modelCalls' ? 'Model' : 'Tool'} call limit exhausted`);
  }
  request[kind]++;
}
