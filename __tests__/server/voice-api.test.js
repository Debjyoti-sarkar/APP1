/**
 * API Integration Tests for Voice Assistant Endpoints
 * Tests the actual API endpoints against the specifications provided
 */

describe('Voice Assistant API Endpoints', () => {
  const BASE_URL = 'http://localhost:3001';

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('POST /assistant/transcribe', () => {
    test('should transcribe audio file and return expected format', async () => {
      // Create mock audio data
      const mockAudioBuffer = Buffer.alloc(1000);
      mockAudioBuffer.fill(0x80); // Fill with mock audio data

      const response = await fetch(`${BASE_URL}/assistant/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: mockAudioBuffer,
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      
      // Verify response structure matches specification
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('confidence');
      
      if (result.success) {
        expect(typeof result.text).toBe('string');
        expect(typeof result.confidence).toBe('number');
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });

    test('should handle invalid audio format', async () => {
      const response = await fetch(`${BASE_URL}/assistant/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      });

      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Invalid audio format');
    });

    test('should handle empty audio data', async () => {
      const response = await fetch(`${BASE_URL}/assistant/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: Buffer.alloc(0), // Empty buffer
      });

      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('No audio data received');
    });
  });

  describe('POST /assistant/parse', () => {
    test('should parse money transfer intent correctly', async () => {
      const testInput = {
        text: 'send 500 to rahul'
      };

      const response = await fetch(`${BASE_URL}/assistant/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testInput),
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      
      // Verify response matches specification
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('intent', 'send_money');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('confidence');
      
      // Verify entities extraction
      expect(result.entities).toHaveProperty('amount', '500');
      expect(result.entities).toHaveProperty('recipient', 'rahul');
      
      // Verify confidence is reasonable
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should parse balance check intent', async () => {
      const testInput = {
        text: 'check my balance'
      };

      const response = await fetch(`${BASE_URL}/assistant/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testInput),
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      
      expect(result).toHaveProperty('intent', 'check_balance');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should handle unknown intents', async () => {
      const testInput = {
        text: 'what is the weather like today'
      };

      const response = await fetch(`${BASE_URL}/assistant/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testInput),
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      
      expect(result).toHaveProperty('intent', 'unknown');
      expect(result.confidence).toBeLessThan(0.7);
    });

    test('should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/assistant/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Missing text field
      });

      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Text is required');
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      
      expect(response.status).toBe(200);
      
      const result = await response.json();
      
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('port', '3001');
      expect(result).toHaveProperty('deepgramReady');
    });
  });
});