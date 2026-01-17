# 1. Introduction

## What is TSpec?

TSpec (Test Specification) is a domain-specific language designed for writing API test cases. Built on YAML 1.2, it provides a structured, readable format that serves two audiences:

1. **AI Systems (LLMs)**: The structured metadata and clear field definitions enable accurate test case generation
2. **Developers**: Reuse mechanisms, data-driven testing, and unified structure improve maintainability

## Design Goals

### AI Generation Accuracy First

The DSL structure, vocabulary, and metadata are designed to provide clear, unambiguous context for Large Language Models (LLMs), reducing generation errors.

Key features supporting AI:
- `ai_prompt` field for natural language test descriptions
- `related_code` paths for context awareness
- Consistent, predictable structure
- Explicit typing and enumerations

### Developer Maintenance Efficiency

Through reuse mechanisms, data-driven testing, and unified structure, TSpec reduces repetitive code and improves readability.

Key features for developers:
- Template inheritance (`extends`)
- Data-driven parameterization (`data`)
- Variable system with built-in functions
- Modular assertion libraries

### Protocol Extensibility

TSpec supports HTTP and gRPC out of the box, with a design that allows smooth extension to new protocols like WebSocket and GraphQL.

### First-Class Citizen Principle

Test cases are treated as first-class citizens alongside source code:
- Version controlled
- Included in CI/CD pipelines
- Subject to code review
- Co-located with implementation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    .tspec File                          │
├─────────────────────────────────────────────────────────┤
│  version, description, metadata                         │
│  ├── environment (runtime config)                       │
│  ├── variables (static variables)                       │
│  ├── data (data sources)                               │
│  ├── extends (template inheritance)                     │
│  ├── lifecycle (setup/teardown)                        │
│  ├── {protocol} (http/grpc request)                    │
│  ├── assertions (validation rules)                     │
│  ├── extract (response extraction)                     │
│  └── output (result handling)                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   TSpec Parser                          │
├─────────────────────────────────────────────────────────┤
│  1. Parse YAML                                          │
│  2. Apply template inheritance                          │
│  3. Generate parameterized cases                        │
│  4. Replace variables                                   │
│  5. Output executable test cases                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Test Execution Engine                    │
├─────────────────────────────────────────────────────────┤
│  1. Execute lifecycle.setup                             │
│  2. Send request (HTTP/gRPC)                           │
│  3. Run assertions                                      │
│  4. Extract variables                                   │
│  5. Execute lifecycle.teardown                          │
│  6. Generate report                                     │
└─────────────────────────────────────────────────────────┘
```

## When to Use TSpec

TSpec is ideal for:

- **API Contract Testing**: Validate that APIs conform to their contracts
- **Functional Testing**: Verify business logic through API calls
- **Integration Testing**: Test interactions between services
- **Regression Testing**: Catch breaking changes automatically
- **AI-Assisted Test Generation**: Leverage LLMs for test creation

## Comparison with Other Tools

| Feature | TSpec | Postman | REST-assured | Karate |
|---------|-------|---------|--------------|--------|
| YAML-based | ✅ | ❌ (JSON) | ❌ (Code) | ✅ |
| AI-optimized | ✅ | ❌ | ❌ | ❌ |
| Multi-protocol | ✅ | Partial | ❌ | ✅ |
| Template inheritance | ✅ | Limited | N/A | ✅ |
| Data-driven | ✅ | ✅ | ✅ | ✅ |
| Version control friendly | ✅ | Limited | ✅ | ✅ |
