import { convertToCSV, exportProcessesToCSV } from '@/utils/exportData';

describe('Export Data Utilities', () => {
  describe('convertToCSV', () => {
    it('should convert simple process data to CSV format', () => {
      const mockData = [
        {
          id: '1',
          name: 'Test Process',
          status: 'completed',
          startTime: new Date('2024-01-01T10:00:00Z'),
          endTime: new Date('2024-01-01T11:00:00Z'),
          duration: 60,
          delay: 0,
          severity: 'Low',
          riskLevel: 'Low',
          riskScore: 20
        }
      ];

      const csv = convertToCSV(mockData);
      
      expect(csv).toContain('id,name,status,startTime,endTime,duration,delay,severity,riskLevel,riskScore');
      expect(csv).toContain('1,Test Process,completed');
      expect(csv).toContain('2024-01-01T10:00:00.000Z');
    });

    it('should handle empty data gracefully', () => {
      const csv = convertToCSV([]);
      expect(csv).toBe('No data available');
    });

    it('should escape commas in text fields', () => {
      const mockData = [{
        id: '1',
        name: 'Process, with comma',
        status: 'completed',
        startTime: new Date('2024-01-01T10:00:00Z'),
        duration: 60
      }];

      const csv = convertToCSV(mockData);
      expect(csv).toContain('"Process, with comma"');
    });

    it('should handle missing fields', () => {
      const mockData = [{
        id: '1',
        name: 'Test Process',
        status: 'in-progress',
        startTime: new Date('2024-01-01T10:00:00Z'),
        duration: 30
        // Missing endTime, delay, etc.
      }];

      const csv = convertToCSV(mockData);
      expect(csv).toBeTruthy();
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });
  });
});
