# API Examples

This document provides practical examples for using the Race Wars API endpoints.

## Authentication

Most endpoints require authentication using a JWT bearer token.

```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use the token in subsequent requests
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Enforcement API

### Get Enforcement Zones for a Route

```bash
curl -X GET http://localhost:3000/api/enforcement/zones/route/route-123
```

**Response:**
```json
[
  {
    "id": "zone-1",
    "route_id": "route-123",
    "name": "Main Straight Speed Limit",
    "zone_type": "speed_limit",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[...]]
    },
    "speed_limit": 100,
    "is_visible": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create a New Enforcement Zone

```bash
curl -X POST http://localhost:3000/api/enforcement/zones \
  -H "Content-Type: application/json" \
  -d '{
    "route_id": "route-123",
    "name": "Turn 1 Speed Trap",
    "zone_type": "speed_trap",
    "geometry": {
      "type": "Point",
      "coordinates": [-122.4184, 37.7754]
    },
    "speed_limit": 80,
    "is_visible": true
  }'
```

### Check Speed Zone Violations

```bash
curl -X POST http://localhost:3000/api/enforcement/check-speed-zones/route-123 \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 37.7754,
    "lng": -122.4184,
    "speed": 120,
    "heading": 90,
    "timestamp": 1704067200000
  }'
```

**Response:**
```json
[
  {
    "zoneId": "zone-1",
    "zoneName": "Main Straight Speed Limit",
    "zoneType": "speed_limit",
    "actualSpeed": 120,
    "speedLimit": 100,
    "overSpeed": 20,
    "severity": "moderate",
    "position": {
      "lat": 37.7754,
      "lng": -122.4184,
      "speed": 120,
      "heading": 90,
      "timestamp": 1704067200000
    },
    "timestamp": 1704067200000
  }
]
```

### Calculate Penalty

```bash
curl -X POST http://localhost:3000/api/enforcement/calculate-penalty \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": "zone-1",
    "zoneName": "Main Straight Speed Limit",
    "zoneType": "speed_limit",
    "actualSpeed": 120,
    "speedLimit": 100,
    "overSpeed": 20,
    "severity": "moderate"
  }'
```

**Response:**
```json
{
  "penaltyType": "time",
  "value": 5,
  "reason": "Speeding violation: 20 km/h over limit"
}
```

## Notifications API

### Get User Notifications

```bash
curl -X GET "http://localhost:3000/api/notifications?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif-1",
      "userId": "user-123",
      "type": "race_starting",
      "title": "Race Starting Soon",
      "message": "The race will start in 5 minutes",
      "priority": "high",
      "read": false,
      "data": {
        "sessionId": "session-456",
        "startTime": "2024-01-01T10:00:00Z"
      },
      "createdAt": "2024-01-01T09:55:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25
  }
}
```

### Mark Notification as Read

```bash
curl -X POST http://localhost:3000/api/notifications/mark-read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notificationId": "notif-1"}'
```

### Update Notification Preferences

```bash
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableEmail": false,
    "enablePush": true,
    "enableInApp": true,
    "raceNotifications": true,
    "flagNotifications": true,
    "penaltyNotifications": false
  }'
```

**Response:**
```json
{
  "message": "Notification preferences updated",
  "preferences": {
    "userId": "user-123",
    "enableEmail": false,
    "enablePush": true,
    "enableInApp": true,
    "raceNotifications": true,
    "flagNotifications": true,
    "penaltyNotifications": false
  }
}
```

## Sector Flags API

### Initialize Sectors

```bash
curl -X POST http://localhost:3000/api/sector-flags/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "sectors": [
      {
        "id": "sector-1",
        "name": "Sector 1",
        "order": 1,
        "startDistance": 0,
        "endDistance": 1000
      },
      {
        "id": "sector-2",
        "name": "Sector 2",
        "order": 2,
        "startDistance": 1000,
        "endDistance": 2000
      }
    ]
  }'
```

### Get All Sectors

```bash
curl -X GET http://localhost:3000/api/sector-flags
```

**Response:**
```json
[
  {
    "id": "sector-1",
    "name": "Sector 1",
    "order": 1,
    "startDistance": 0,
    "endDistance": 1000
  },
  {
    "id": "sector-2",
    "name": "Sector 2",
    "order": 2,
    "startDistance": 1000,
    "endDistance": 2000
  }
]
```

### Set Sector Flag

```bash
curl -X PUT http://localhost:3000/api/sector-flags/sector-1/flag \
  -H "Content-Type: application/json" \
  -d '{
    "flag": "yellow",
    "reason": "Debris on track",
    "updatedBy": "marshal-1",
    "propagate": true
  }'
```

**Response:**
```json
{
  "changes": [
    {
      "sectorId": "sector-1",
      "previousFlag": "green",
      "newFlag": "yellow",
      "reason": "Debris on track",
      "timestamp": 1704067200000,
      "updatedBy": "marshal-1"
    },
    {
      "sectorId": "sector-2",
      "previousFlag": "green",
      "newFlag": "yellow",
      "reason": "Yellow flag propagation",
      "timestamp": 1704067200000,
      "updatedBy": "marshal-1"
    }
  ]
}
```

### Get Flag at Position

```bash
curl -X GET http://localhost:3000/api/sector-flags/position/1500/flag
```

**Response:**
```json
{
  "flag": "yellow"
}
```

### Get All Sector Flags

```bash
curl -X GET http://localhost:3000/api/sector-flags/flags
```

**Response:**
```json
[
  {
    "sectorId": "sector-1",
    "flag": "yellow",
    "reason": "Debris on track",
    "updatedAt": 1704067200000,
    "updatedBy": "marshal-1"
  },
  {
    "sectorId": "sector-2",
    "flag": "yellow",
    "reason": "Yellow flag propagation",
    "updatedAt": 1704067200000,
    "updatedBy": "marshal-1"
  }
]
```

### Clear All Flags

```bash
curl -X POST http://localhost:3000/api/sector-flags/clear \
  -H "Content-Type: application/json" \
  -d '{"updatedBy": "race-director"}'
```

### Get Flag History

```bash
curl -X GET "http://localhost:3000/api/sector-flags/history?limit=50"
```

**Response:**
```json
[
  {
    "sectorId": "sector-1",
    "previousFlag": "green",
    "newFlag": "yellow",
    "reason": "Debris on track",
    "timestamp": 1704067200000,
    "updatedBy": "marshal-1"
  }
]
```

### Initialize Marshal Zones

```bash
curl -X POST http://localhost:3000/api/sector-flags/marshal-zones/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "zones": [
      {
        "id": "marshal-1",
        "name": "Marshal Zone 1",
        "sectorId": "sector-1",
        "position": {
          "lat": 37.7754,
          "lng": -122.4184
        },
        "radioChannel": "Channel 1",
        "primaryContact": "John Doe",
        "isActive": true
      }
    ]
  }'
```

### Activate Marshal Zone

```bash
curl -X POST http://localhost:3000/api/sector-flags/marshal-zones/marshal-1/activate
```

### Report Incident to Marshal Zone

```bash
curl -X POST http://localhost:3000/api/sector-flags/marshal-zones/marshal-1/incident \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "type": "car_stopped",
      "location": {
        "lat": 37.7754,
        "lng": -122.4184
      },
      "driverId": "driver-123",
      "description": "Car stopped on track"
    }
  }'
```

## Proximity API

### Check Proximity Between Drivers

```bash
curl -X POST http://localhost:3000/api/proximity/check \
  -H "Content-Type: application/json" \
  -d '{
    "driver1": {
      "id": "driver-1",
      "position": {
        "lat": 37.7754,
        "lng": -122.4184,
        "speed": 100,
        "heading": 90
      }
    },
    "driver2": {
      "id": "driver-2",
      "position": {
        "lat": 37.7755,
        "lng": -122.4185,
        "speed": 105,
        "heading": 85
      }
    },
    "thresholdMeters": 50
  }'
```

**Response:**
```json
{
  "isProximate": true,
  "distance": 15.5,
  "closingSpeed": 10,
  "isDangerous": true
}
```

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse. If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

## WebSocket Connection

For real-time updates, connect to the WebSocket endpoint:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_JWT_TOKEN'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

WebSocket message types:
- `auth` - Authentication
- `position_update` - Driver position updates
- `flag_change` - Sector flag changes
- `notification` - New notifications
- `penalty` - Penalty notifications
