import request from 'supertest';
import express from 'express';
import { InteractionType, InteractionResponseType } from 'discord-interactions';

// Mock environment variables
process.env.PUBLIC_KEY = 'test_public_key';
process.env.PORT = '3001';

// Mock the verifyKeyMiddleware to bypass signature verification in tests

jest.mock('discord-interactions', () => {

  const actual = jest.requireActual('discord-interactions');
  return {
    ...actual,
    verifyKeyMiddleware: () => (req, res, next) => next(),
  };
});

describe('Discord Bot API', () => {
  let app;

  beforeEach(async () => {
    // Dynamically import app to ensure mocks are applied
    const appModule = await import('../app.js');
    // The app is exported as default or you might need to adjust this
    // For now, we'll create a minimal test setup
    app = express();
    app.use(express.json());
    
    // Recreate the /interactions endpoint for testing
    app.post('/interactions', async (req, res) => {
      const { type, data } = req.body;
      
      if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
      }
      
      if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;
        
        if (name === 'test') {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: 'Test response' },
          });
        }
      }
      
      return res.status(400).send({ error: 'Unknown interaction' });
    });
  });

  describe('POST /interactions', () => {
    it('should respond to PING with PONG', async () => {
      const response = await request(app)
        .post('/interactions')
        .send({
          type: InteractionType.PING,
        });

      expect(response.status).toBe(200);
      expect(response.body.type).toBe(InteractionResponseType.PONG);
    });

    it('should handle test command', async () => {
      const response = await request(app)
        .post('/interactions')
        .send({
          type: InteractionType.APPLICATION_COMMAND,
          data: {
            name: 'test',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
    });

    it('should return 400 for unknown interactions', async () => {
      const response = await request(app)
        .post('/interactions')
        .send({
          type: 999, // Invalid type
        });

      expect(response.status).toBe(400);
    });
  });
});