import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EventsService } from './events.service';

describe('EventsService', () => {
  const queryRows = jest.fn();
  const service = new EventsService({ queryRows } as unknown as DatabaseService);

  beforeEach(() => queryRows.mockReset());

  it('only asks for published or paused events', async () => {
    queryRows.mockResolvedValue([{ id: 'event-1', title: 'Demo' }]);
    await expect(service.listPublished()).resolves.toEqual({
      items: [{ id: 'event-1', title: 'Demo' }],
    });
    expect(queryRows.mock.calls[0][0]).toContain("e.trang_thai IN ('DA_CONG_BO','TAM_NGUNG')");
  });

  it('returns 404 for a missing or unpublished event', async () => {
    queryRows.mockResolvedValue([]);
    await expect(service.getPublished('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(queryRows).toHaveBeenCalledWith(
      expect.stringContaining("trang_thai IN ('DA_CONG_BO','TAM_NGUNG')"),
      ['missing'],
    );
  });

  it('filters sessions by the event ID', async () => {
    queryRows.mockResolvedValueOnce([{ id: 'event-1', title: 'Demo' }]);
    queryRows.mockResolvedValueOnce([{ id: 'session-1', capacity: 80 }]);
    await expect(service.listSessions('event-1')).resolves.toEqual({
      items: [{ id: 'session-1', capacity: 80 }],
    });
    expect(queryRows.mock.calls[1][1]).toEqual(['event-1']);
  });
});
