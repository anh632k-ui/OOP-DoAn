import { BadRequestException } from '@nestjs/common';
import {
  sessionInput, allocationMethod, optionalPatch, verifiedAccessibility,
} from './management.validation';

describe('Management validation', () => {
  it('requires timezone aware and ordered session times', () => {
    const input = {
      venueId: '30000000-0000-4000-8000-000000000001',
      capacity: 80,
      startsAt: '2031-06-01T10:00:00+07:00',
      endsAt: '2031-06-01T12:00:00+07:00',
      registrationOpensAt: '2031-04-01T10:00:00+07:00',
      registrationClosesAt: '2031-05-31T18:00:00+07:00',
    };
    expect(sessionInput(input).capacity).toBe(80);
    expect(() => sessionInput({ ...input, capacity: 0 }))
      .toThrow(BadRequestException);
    expect(() => sessionInput({ ...input, endsAt: input.startsAt }))
      .toThrow(BadRequestException);
    expect(() => sessionInput({ ...input, startsAt: '2031-06-01' }))
      .toThrow(BadRequestException);
  });

  it('restricts policy and patch shape', () => {
    expect(allocationMethod({ method: 'FCFS' })).toBe('FCFS');
    expect(() => allocationMethod({ method: 'HYBRID' }))
      .toThrow(BadRequestException);
    expect(() => optionalPatch({ ownerId: 'malicious' }))
      .toThrow(BadRequestException);
  });

  it('requires verified accessibility details', () => {
    expect(() => verifiedAccessibility({ featureIds: [], verified: false }))
      .toThrow(BadRequestException);
    expect(verifiedAccessibility({ featureIds: [], verified: true }))
      .toEqual({ ids: [], note: '' });
  });
});
