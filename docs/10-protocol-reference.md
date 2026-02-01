# 10. Protocol Reference

TSpec supports multiple protocols through dedicated protocol blocks. Each protocol has its own configuration structure.

## HTTP/HTTPS

File extension: `.http.tcase`

### Configuration

```yaml
http:
  method: "POST"                    # HTTP method
  path: "/v1/auth/login"            # Request path
  headers:                          # Request headers
    Content-Type: "application/json"
    Authorization: "Bearer ${token}"
  query:                            # URL query parameters
    page: 1
    limit: 10
  body:                             # Request body (choose one)
    json: { ... }                   # JSON body
    form: { ... }                   # Form data
    raw: "..."                      # Raw text
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | string | Yes | HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS) |
| `path` | string | Yes | Request path (appended to environment host) |
| `headers` | object | No | Request headers |
| `query` | object | No | URL query parameters |
| `body` | object | No | Request body |

### Body Types

#### JSON Body

```yaml
http:
  body:
    json:
      username: "test_user"
      password: "${env.PASSWORD}"
      metadata:
        source: "api_test"
```

Sets `Content-Type: application/json` automatically if not specified.

#### Form Data

```yaml
http:
  body:
    form:
      username: "test_user"
      password: "${env.PASSWORD}"
      remember: "true"
```

Sets `Content-Type: application/x-www-form-urlencoded` automatically.

#### Raw Body

```yaml
http:
  body:
    raw: |
      <?xml version="1.0"?>
      <request>
        <username>test_user</username>
      </request>
```

### Query Parameters

```yaml
http:
  method: "GET"
  path: "/api/users"
  query:
    page: 1
    limit: 20
    sort: "created_at"
    order: "desc"
    filter: "status:active"
```

Generates: `/api/users?page=1&limit=20&sort=created_at&order=desc&filter=status:active`

### Complete HTTP Example

```yaml
version: "1.0"
description: "Create new user"

metadata:
  prompt: "Test user creation with valid data"
  related_code: ["src/controllers/user.controller.js"]
  test_category: "functional"
  risk_level: "high"
  tags: ["user", "create"]
  priority: "high"
  timeout: "10s"

environment:
  host: "${API_HOST|api.example.com}"
  scheme: "https"

http:
  method: "POST"
  path: "/api/v1/users"
  headers:
    Content-Type: "application/json"
    Authorization: "Bearer ${env.ADMIN_TOKEN}"
    X-Request-ID: "${uuid}"
  body:
    json:
      email: "test_${timestamp}@example.com"
      password: "SecurePass123!"
      name: "Test User"
      role: "user"

assertions:
  - type: "json_path"
    expression: "$.status"
    operator: "equals"
    expected: 201
  - type: "json_path"
    expression: "$.body.data.id"
    operator: "exists"
  - type: "json_path"
    expression: "$.header['Location']"
    operator: "matches"
    pattern: "^/api/v1/users/[a-zA-Z0-9]+$"

extract:
  user_id: "$.data.id"
```

---

## gRPC

File extension: `.grpc.tcase`

### Configuration

```yaml
grpc:
  service: "user.UserService"       # Full service name
  method: "GetUserProfile"          # RPC method name
  package: "com.example.user"       # Protobuf package
  proto_file: "protos/user.proto"   # Proto file path
  deadline_ms: 5000                 # Timeout in milliseconds
  metadata:                         # gRPC metadata (headers)
    authorization: "Bearer ${token}"
    trace_id: "test_${uuid}"
  request:                          # Request message
    user_id: "U123"
    include_sensitive: false
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `service` | string | Yes | Full gRPC service name |
| `method` | string | Yes | RPC method name |
| `package` | string | Yes | Protobuf package name |
| `proto_file` | string | Yes | Path to .proto file |
| `deadline_ms` | integer | No | Request timeout (default: 5000) |
| `metadata` | object | No | gRPC metadata/headers |
| `request` | object | Yes | Request message fields |

### Request Message

Map request fields to their Protobuf definitions:

**Proto definition**:
```protobuf
message GetUserRequest {
  string user_id = 1;
  bool include_sensitive = 2;
  repeated string fields = 3;
}
```

**TSpec request**:
```yaml
grpc:
  request:
    user_id: "U123456"
    include_sensitive: false
    fields:
      - "name"
      - "email"
      - "created_at"
```

### Complete gRPC Example

```yaml
version: "1.0"
description: "Get user profile via gRPC"

metadata:
  prompt: "Test fetching user profile through gRPC service"
  related_code: ["src/services/user_service.go"]
  test_category: "functional"
  risk_level: "medium"
  tags: ["user", "grpc", "profile"]
  priority: "medium"
  timeout: "10s"

environment:
  host: "${GRPC_HOST|localhost}"
  port: "${GRPC_PORT|50051}"

variables:
  user_id: "U123456"

grpc:
  service: "user.UserService"
  method: "GetUserProfile"
  package: "com.example.user"
  proto_file: "protos/user.proto"
  deadline_ms: 5000
  metadata:
    authorization: "Bearer ${env.AUTH_TOKEN}"
    x-request-id: "${uuid}"
  request:
    user_id: "${user_id}"
    include_sensitive: false

assertions:
  - type: "json_path"
    expression: "$.grpcCode"
    operator: "equals"
    expected: "OK"
  - type: "json_path"
    expression: "$.body.user.id"
    operator: "equals"
    expected: "${user_id}"
  - type: "json_path"
    expression: "$.body.user.name"
    operator: "not_empty"
  - type: "response_time"
    max_ms: 1000

extract:
  user_name: "user.name"
  user_email: "user.email"
```

---

## GraphQL (Reserved)

File extension: `.graphql.tcase`

> Note: GraphQL support is reserved for future implementation.

### Planned Configuration

```yaml
graphql:
  operation: "query"                # query, mutation, subscription
  name: "GetUser"                   # Operation name
  query: |                          # GraphQL query
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
      }
    }
  variables:                        # Query variables
    id: "${user_id}"
```

---

## WebSocket (Reserved)

File extension: `.websocket.tcase`

> Note: WebSocket support is reserved for future implementation.

### Planned Configuration

```yaml
websocket:
  path: "/ws/chat"
  subprotocol: "chat.v1"
  messages:
    - direction: "send"
      data:
        type: "join"
        room: "test-room"
    - direction: "receive"
      timeout_ms: 5000
      match:
        type: "joined"
```

---

## Protocol Extension

TSpec is designed for protocol extensibility. New protocols can be added by:

1. Define a new top-level block (e.g., `websocket:`)
2. Implement protocol-specific execution in the test runner
3. Add protocol-specific assertion types if needed

The core DSL structure remains unchanged when adding new protocols.
