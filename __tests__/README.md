# Test Suite for Shorty App

This directory contains comprehensive tests for the Shorty webhook application.

## Test Structure

- `webhook.test.js` - Unit tests for the main webhook handler functionality
- `pr.test.js` - Unit tests for PR utility functions
- `integration.test.js` - Integration tests for the complete webhook flow
- `README.md` - This file

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Coverage

The tests cover:

1. **Webhook Event Processing**
   - Story state changes to "Ready for Review"
   - Comment creation events
   - Different workflow types (Product Development vs Operational Tasks)
   - Error handling for API failures

2. **Discord Integration**
   - Message formatting and sending
   - Channel selection based on workflow type
   - User mention mapping
   - PR link extraction and inclusion

3. **PR Utility Functions**
   - GitHub PR URL extraction from text
   - Comment text processing
   - URL validation

4. **Error Handling**
   - Malformed webhook payloads
   - API failures
   - Missing data scenarios

## Test Data

The tests use the provided webhook event structure:
```json
{
  "id": "68496234-90f4-43cf-826e-d75f124a16b1",
  "changed_at": "2025-06-11T11:02:12.608Z",
  "version": "v1",
  "primary_id": 2925,
  "actor_name": "Ephy",
  "member_id": "6380d4da-0ae7-4ca5-a7f4-59ba335b4460",
  "actions": [...]
}
```

## Mocking Strategy

- **Discord.js**: Mocked to prevent actual Discord API calls
- **Axios**: Mocked to simulate Shortcut API responses
- **Environment Variables**: Set to test values
- **Console**: Suppressed during tests to reduce noise

## Configuration

- Jest configuration is in `jest.config.js`
- Global test setup is in `jest.setup.js`
- Coverage reports are generated in the `coverage/` directory 