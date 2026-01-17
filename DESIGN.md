# DSL 规范 v1.0

**——面向“开发+AI”协作的多协议测试用例领域特定语言**

---

## 1. 设计目标

- **AI生成准确性优先**：DSL结构、词汇和元信息必须为大型语言模型（LLM）提供清晰、无歧义的上下文，降低生成错误率。
- **开发者维护效率高**：通过复用机制、数据驱动和统一结构，减少重复代码，提升可读性与可维护性。
- **协议扩展性强**：支持 HTTP、gRPC 等主流协议，并能平滑扩展至新协议（如 WebSocket、GraphQL）。
- **一等公民原则**：测试用例与源代码同等重要，纳入版本控制、CI/CD 和代码审查流程。

---

## 2. 文件规范

### 2.1 命名与格式
- **扩展名**：`.tspec`（Test Specification）
- **协议标识**：在扩展名前添加协议后缀，如：
  - `.http.tspec`
  - `.grpc.tspec`
  - `.graphql.tspec`（预留）
- **命名模式**：`{业务场景}_{测试类型}_{描述}.{协议}.tspec`  
  示例：`login_functional_success.http.tspec`

### 2.2 编码与语法
- **编码**：UTF-8
- **语法**：YAML 1.2（严格缩进，禁止内联复杂表达式）
- **注释**：仅允许在文件顶部或字段上方使用 `#` 注释，用于解释非显而易见的逻辑。

---

## 3. 核心结构（Top-Level Schema）

每个 `.tspec` 文件必须包含以下顶层字段（按推荐顺序）：

```yaml
version: "1.0"                  # 必填，DSL规范版本
description: "..."              # 必填，自然语言描述测试意图

metadata:                       # 必填，AI与开发者协作的核心
environment:                    # 可选，运行环境配置
variables:                      # 可选，用例级变量（作用域：当前文件）
data:                           # 可选，测试数据源
extends:                        # 可选，模板继承路径
lifecycle:                      # 可选，前置/后置动作
{protocol}:                     # 必填，协议专属块（如 http, grpc）
assertions:                     # 必填，验证规则列表
extract:                        # 可选，响应提取变量
output:                         # 可选，结果处理策略
```

> **说明**：除 `version`、`description`、`metadata`、`{protocol}`、`assertions` 外，其余字段均可省略。

---

## 4. 字段详细定义

### 4.1 `metadata`（必填）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ai_prompt` | string | ✅ | **AI生成核心指令**。用自然语言描述测试目标、输入、预期输出及边界条件。 |
| `related_code` | list[str] | ✅ | 关联的源代码路径（相对仓库根目录），用于AI理解上下文。 |
| `business_rule` | string | ❌ | 对应的业务规则编号或描述（如 “RBAC-001”）。 |
| `test_category` | enum | ✅ | `functional`, `integration`, `performance`, `security` |
| `risk_level` | enum | ✅ | `low`, `medium`, `high`, `critical` |
| `tags` | list[str] | ✅ | 用于筛选和分组（如 `["auth", "smoke"]`） |
| `priority` | enum | ✅ | `low`, `medium`, `high` |
| `timeout` | duration | ✅ | 用例最大执行时间（如 `10s`, `5m`） |

> **示例**：
> ```yaml
> metadata:
>   ai_prompt: |
>     验证用户使用有效凭据登录时，返回200状态码和有效JWT token。
>     密码来自环境变量 TEST_PASSWORD，用户名固定为 test_user_001。
>   related_code:
>     - "src/main/java/com/example/auth/LoginController.java"
>   business_rule: "AUTH-01: 登录成功需返回会话令牌"
>   test_category: "functional"
>   risk_level: "high"
>   tags: ["auth", "login", "smoke"]
>   priority: "high"
>   timeout: "15s"
> ```

---

### 4.2 `environment`

定义运行时环境变量，支持默认值和外部覆盖。

```yaml
environment:
  name: "${ENV_NAME|staging}"        # 环境名称，默认 staging
  host: "${API_HOST|api.example.com}" # 主机地址
  port: "${API_PORT|443}"            # 端口（可选）
  scheme: "${SCHEME|https}"          # 协议（http/https）
  variables:                         # 环境级变量
    max_retry: 3
    base_path: "/v1"
```

> **变量解析优先级**：命令行参数 > 环境变量 > 用例内 `variables` > 模板变量

---

### 4.3 `variables`

定义用例内部静态变量，作用域限于当前文件。

```yaml
variables:
  user_id: "U123456"
  timestamp: "${timestamp}"         # 内置函数：当前毫秒时间戳
  uuid: "${uuid}"                   # 内置函数：生成UUID
```

---

### 4.4 `data`（数据驱动）

支持外部数据源驱动参数化测试。

```yaml
data:
  source: "datasets/login_cases.csv"  # 数据文件路径（相对 api/ 目录）
  driver: "parameterized"             # 驱动模式：parameterized（逐行执行）
  format: "csv"                       # 支持 csv, json, yaml
  current_row: 0                      # 仅用于单行测试；参数化时忽略
```

> **CSV 示例**：
> ```
> username,password,expected_status
> user1,pass123,200
> ,pass123,400
> ```

---

### 4.5 `extends`（模板继承）

继承一个或多个模板文件（YAML格式），支持 `$parent` 合并策略。

```yaml
extends: "templates/base_http.yaml"
```

> **模板合并规则**：
> - 标量值：子覆盖父
> - 列表：子追加到父（除非显式 `$replace: true`）
> - Map：深度合并（除非字段以 `$` 开头，如 `$parent: true` 表示保留父值并扩展）

---

### 4.6 `lifecycle`

定义测试生命周期钩子。

```yaml
lifecycle:
  setup:
    - action: "db.reset_table"
      params:
        table: "users"
        condition: "username LIKE 'test_%'"
    - action: "api.call"
      target: "/v1/test/setup"
      method: "POST"
  teardown:
    - action: "cache.clear"
      params:
        pattern: "user:*"
```

> **标准动作库**（由执行引擎实现）：
> - `db.reset_table`, `db.insert_record`
> - `cache.clear`, `cache.set`
> - `api.call`, `log.test_start`

---

### 4.7 协议专属块（Protocol Blocks）

#### 4.7.1 `http`（HTTP/HTTPS）

```yaml
http:
  method: "POST"                    # GET, POST, PUT, DELETE, PATCH
  path: "/v1/auth/login"            # 路径（拼接 environment.host）
  headers:                          # 请求头
    Content-Type: "application/json"
    X-Request-ID: "req_${timestamp}"
  query: {}                         # URL 查询参数（Map）
  body:                             # 请求体（三选一）
    json: { username: "...", password: "..." }
    # form: { key: value }
    # raw: "plain text"
```

#### 4.7.2 `grpc`（gRPC）

```yaml
grpc:
  service: "user.UserService"       # 完整服务名
  method: "GetUserProfile"          # 方法名
  package: "com.example.user"       # Protobuf 包名
  proto_file: "protos/user.proto"   # .proto 文件路径
  deadline_ms: 5000                 # 超时（毫秒）
  metadata:                         # gRPC 元数据（headers）
    trace_id: "test_${uuid}"
  request:                          # 请求消息（Map，映射 Protobuf 字段）
    user_id: "U123"
    include_sensitive: false
```

> **扩展性**：新增协议只需定义新的顶层块（如 `websocket:`），不破坏现有结构。

---

### 4.8 `assertions`（断言）

断言是验证测试结果的核心，支持内置类型和自定义脚本。

#### 通用结构
```yaml
- type: "<assertion_type>"
  [其他字段...]
  message: "可选，失败时显示的提示"
```

#### 内置断言类型

| 类型 | 适用协议 | 字段 | 说明 |
|------|--------|------|------|
| `status_code` | HTTP | `expected: int` | 验证 HTTP 状态码 |
| `grpc_code` | gRPC | `expected: string` | 如 `"OK"`, `"NOT_FOUND"` |
| `response_time` | All | `max_ms: int` | 响应时间上限（毫秒） |
| `json_path` | All (JSON) | `expression: "$.path"`, `operator: "equals/exists/matches"`, `expected/pattern` | JSON 路径断言 |
| `proto_field` | gRPC | `path: "user.name"`, `operator: "not_empty/equals"` | Protobuf 字段断言 |
| `header` | HTTP | `name: "Set-Cookie"`, `operator: "contains/equals"`, `value` | 响应头断言 |
| `javascript` | All | `source: "..."` | 自定义 JS 脚本（返回 boolean） |

#### 断言复用（Include）
```yaml
- include: "assertions/common.yaml#common.success_status"
```

> **断言库格式**（`assertions/common.yaml`）：
> ```yaml
> definitions:
>   - id: "common.success_status"
>     type: "status_code"
>     expected: 200
> ```

---

### 4.9 `extract`（响应提取）

从响应中提取值，存入变量供后续使用（如链式测试）。

```yaml
extract:
  session_token: "$.data.token"     # JSONPath 表达式
  user_id: "$.data.user.id"
```

> 提取的变量可在同一用例的 `output` 或后续用例中通过 `${extract.session_token}` 引用。

---

### 4.10 `output`（结果处理）

```yaml
output:
  save_response_on_failure: true    # 失败时保存完整响应
  metrics: ["latency", "throughput"] # 上报指标（用于监控）
  notifications:
    - type: "slack"
      channel: "#test-alerts"
      condition: "failure"          # failure / success / always
```

---

## 5. 变量与表达式系统

### 5.1 变量引用语法
- `${variable_name}`：引用变量
- `${env.VAR_NAME}`：引用环境变量
- `${extract.key}`：引用提取值
- `${function()}`：调用内置函数

### 5.2 内置函数
| 函数 | 说明 |
|------|------|
| `timestamp` | 当前 Unix 毫秒时间戳 |
| `uuid` | 生成 UUID v4 |
| `random_int(min, max)` | 生成随机整数 |
| `now(format="yyyy-MM-dd")` | 当前日期（支持 Java SimpleDateFormat） |

---

## 6. 目录结构与工作流

### 6.1 推荐仓库结构
```
my-service/
├── src/                          # 源代码
├── api/
│   ├── contracts/                # OpenAPI / .proto
│   ├── testcases/                # 测试用例
│   │   ├── auth/
│   │   │   └── login/
│   │   │       ├── success.http.tspec
│   │   │       └── invalid_password.http.tspec
│   │   └── _templates/           # 模板
│   ├── datasets/                 # 测试数据
│   └── suites/                   # 测试套件（YAML 列表）
├── config/                       # 环境配置
└── scripts/                      # 执行脚本
```

### 6.2 开发工作流
1. 开发者修改 API 代码。
2. **手动触发** AI 辅助生成/更新 `.tspec` 文件（基于 `ai_prompt` 和契约）。
3. 本地运行测试验证。
4. 提交代码 + `.tspec` 文件到同一 PR。
5. CI 自动执行所有关联测试。

> **关键原则**：AI 是辅助工具，**不自动检测代码变更**，不自动提交用例。

---

## 7. 扩展性与未来演进

- **新协议**：只需定义新的顶层块（如 `websocket:`），无需修改核心规范。
- **新断言**：在执行引擎中注册新 `type`，DSL 语法保持不变。
- **新变量函数**：扩展内置函数库，不影响现有用例。
- **AI提示模板**：团队可维护 `ai-prompts/` 目录，指导 AI 生成符合规范的用例。

---

## 附录 A：完整 HTTP 用例示例

```yaml
# login_functional_success.http.tspec
version: "1.0"
description: "验证有效凭据登录成功"

metadata:
  ai_prompt: |
    使用有效用户名和密码调用登录接口，应返回200和有效token。
    密码从环境变量 TEST_PASSWORD 读取。
  related_code:
    - "src/main/java/com/example/auth/LoginController.java"
  business_rule: "AUTH-01"
  test_category: "functional"
  risk_level: "high"
  tags: ["auth", "login", "smoke"]
  priority: "high"
  timeout: "10s"

extends: "templates/base_auth.yaml"

environment:
  name: "${ENV_NAME|staging}"
  host: "${API_HOST|api.example.com}"

variables:
  username: "test_user_001"

data:
  variables:
    password: "${env.TEST_PASSWORD}"

http:
  method: "POST"
  path: "/v1/auth/login"
  headers:
    Content-Type: "application/json"
  body:
    json:
      username: "${username}"
      password: "${password}"

assertions:
  - type: "status_code"
    expected: 200
  - type: "json_path"
    expression: "$.data.token"
    operator: "matches"
    pattern: "^[A-Za-z0-9-_]{128,}$"
  - type: "response_time"
    max_ms: 1000

extract:
  token: "$.data.token"

output:
  save_response_on_failure: true
```
