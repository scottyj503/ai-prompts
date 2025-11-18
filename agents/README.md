# Claude Code Agents

A collection of specialized AI agents for Claude Code CLI to automate complex development workflows.

## Overview

This repository contains production-ready agents that extend Claude Code's capabilities for AWS serverless development, React micro-frontends, Java/Quarkus applications, gap analysis, and Jira story creation.

## Available Agents

### 1. **gap-analysis** (941 lines)
Performs multi-dimensional gap analysis across code repositories, schemas, scenarios, and UI designs.

**Use Cases:**
- Analyzing AWS serverless implementations (Lambda, DynamoDB, AppSync, React)
- Validating schema → code alignment
- Checking GAAP compliance for financial systems
- Validating TypeScript, React, GraphQL, and AWS Lambda best practices
- Identifying missing implementations and inconsistencies

**Triggers:** Automatically invoked when you request gap analysis, implementation validation, or compliance checking.

**Output:** Comprehensive gap report with prioritized findings and proposed story titles for user approval.

**Next Step:** Use `jira-story-creator` agent to convert approved findings to Jira.

---

### 2. **jira-story-creator** (1,957 lines)
Converts schema documentation and gap analysis findings into well-structured Jira epics and stories.

**Use Cases:**
- Creating Jira implementation tasks from JSON/GraphQL schemas
- Converting gap analysis findings to trackable work items
- Generating epics with dependency tracking
- Documenting foreign keys, transactions, and constraints

**Triggers:** Automatically invoked when you have approved schemas or gap findings to convert to Jira stories.

**Input:** Approved story list from gap-analysis agent OR direct schema files.

**Output:** Jira epics and stories with comprehensive descriptions, acceptance criteria, and "Blocks" relationships.

---

### 3. **schema-documentation** (510 lines)
Generates comprehensive, professional documentation for JSON schemas and workflow examples.

**Use Cases:**
- Creating schema overview documents with field references
- Documenting validation rules and state transitions
- Generating workflow examples with complete JSON data
- Creating API operation guides
- Optional Confluence upload

**Triggers:** Automatically invoked when you provide JSON schema files and request documentation.

**Output:** Well-structured markdown files with collapsible sections, code examples, and diagrams.

---

### 4. **react-mf-agent** (1,827 lines)
Specialized agent for creating React Module Federation micro-frontends following bulletproof-react architecture.

**Use Cases:**
- Scaffolding new Module Federation micro-frontends
- Creating feature modules with GraphQL integration
- Implementing Zustand state management
- Setting up React Query for server state
- Configuring Playwright E2E and Vitest unit tests

**Triggers:** Automatically invoked when you request React Module Federation setup or component creation.

**Stack:**
- Module Federation with Vite
- GraphQL with codegen
- Zustand + React Query
- React Hook Form
- Playwright + Vitest

---

### 5. **java-quarkus-agent** (111 lines)
Generates Java/Quarkus projects and components following best practices.

**Use Cases:**
- Creating new Quarkus REST API projects
- Generating service components with database integration
- Setting up Kafka messaging integration
- Implementing CRUD operations with security

**Triggers:** Automatically invoked when you request Quarkus project scaffolding or Java component generation.

**Stack:**
- Quarkus framework
- Gradle build system
- Spotless (Google Java Style Guide)
- JUnit 5, AssertJ, Mockito
- Security best practices (OWASP Top 10)

**External Rules:** Consults `~/.claude/java_rules.md` for comprehensive Java development guidelines.

---

### 6. **code-quality-reviewer** (129 lines)
Reviews code quality across multiple programming languages, ensuring adherence to best practices and linting rules.

**Use Cases:**
- Reviewing code after writing new features
- Validating refactored code
- Checking compliance with coding standards
- Identifying security vulnerabilities
- Verifying test coverage

**Triggers:** Automatically invoked after significant code changes or when you request code review.

**Output:** Structured report categorized by severity (Critical, High, Medium, Low) with actionable recommendations.

---

## Installation

### Project-Level (Recommended for Teams)

Copy agents to your project's `.claude/agents/` directory:

```bash
mkdir -p .claude/agents
cp *.md .claude/agents/
```

### User-Level (Available Across All Projects)

Copy agents to your home directory:

```bash
mkdir -p ~/.claude/agents
cp *.md ~/.claude/agents/
```

## Usage

### Automatic Invocation (Recommended)

Simply describe what you want to accomplish, and Claude will automatically invoke the appropriate agent:

```bash
# Triggers gap-analysis agent
"Analyze gaps in my AWS Lambda implementation"

# Triggers jira-story-creator agent
"Create Jira stories from these approved gaps"

# Triggers react-mf-agent
"Create a new Module Federation component for user profiles"

# Triggers java-quarkus-agent
"Generate a Quarkus REST API for order management"

# Triggers schema-documentation agent
"Generate documentation for this JSON schema"

# Triggers code-quality-reviewer agent
"Review the code quality of my recent changes"
```

### Manual Invocation

You can also explicitly request a specific agent:

```bash
/agent gap-analysis
/agent jira-story-creator
/agent react-mf-agent
```

## Agent Architecture

All agents follow Claude Code best practices:

### YAML Frontmatter Structure
```yaml
---
name: agent-name
description: |
  PROACTIVELY use this agent when... MUST BE USED when...
  [Detailed description with trigger scenarios]
tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, TodoWrite
model: sonnet
---
```

### Key Features
- ✅ **Proactive triggers** for automatic invocation
- ✅ **Explicit tool restrictions** for security
- ✅ **Clear activation scenarios** in descriptions
- ✅ **Cross-references** between related agents
- ✅ **Focused, single-responsibility** design

## Workflows

### Complete Gap-to-Jira Workflow

1. **Gap Analysis Phase**
   ```
   User: "Analyze gaps between my schemas and Lambda implementations"
   → gap-analysis agent analyzes code, schemas, scenarios
   → Presents findings and proposed stories
   → User approves/revises story list
   ```

2. **Jira Creation Phase**
   ```
   User: "Create Jira stories from approved gaps"
   → jira-story-creator agent creates epics and stories
   → Links dependencies with "Blocks" relationships
   → Documents constraints and acceptance criteria
   ```

### Direct Schema-to-Jira (Skip Gap Analysis)

```
User: "Create Jira stories from api-schema.json"
→ jira-story-creator agent reads schema directly
→ Generates implementation stories
→ No gap analysis needed
```

## Configuration

### Environment Variables (for Jira)

Required for `jira-story-creator` agent:

```bash
export JIRA_USER_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_BASE_URL="your-company.atlassian.net"
```

### External Rules

**java-quarkus-agent** references `~/.claude/java_rules.md` for comprehensive Java development guidelines. Ensure this file exists if using the Java agent.

## Best Practices

### When to Use Each Agent

| Scenario | Agent |
|----------|-------|
| "Is my implementation complete?" | gap-analysis |
| "Create Jira tasks from requirements" | jira-story-creator |
| "Document this schema" | schema-documentation |
| "Build a React micro-frontend" | react-mf-agent |
| "Generate a Quarkus service" | java-quarkus-agent |
| "Review my code quality" | code-quality-reviewer |

### Agent Combinations

**Gap Analysis → Jira Creation**
```
gap-analysis (identify gaps)
  → User approves findings
  → jira-story-creator (create stories)
```

**React Development → Code Review**
```
react-mf-agent (create components)
  → code-quality-reviewer (validate quality)
```

## Customization

### Modifying Agents

All agents are markdown files with clear section structure:

1. **YAML Frontmatter**: Agent metadata and configuration
2. **Overview**: Purpose and use cases
3. **Workflow**: Step-by-step process
4. **Patterns**: Technical implementation patterns
5. **Examples**: Usage examples and templates

Edit any `.md` file to customize behavior, add patterns, or adjust workflows.

### Adding New Agents

Create a new `.md` file following the template:

```markdown
---
name: your-agent-name
description: |
  PROACTIVELY use this agent when... MUST BE USED when...
tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, TodoWrite
model: sonnet
---

# Your Agent Name

[Agent instructions here...]
```

## Troubleshooting

### Agent Not Appearing in `/agents` Command

**Issue**: Agent file exists but doesn't show in agent list.

**Solution**: Ensure YAML frontmatter has all required fields (`name`, `description`, `tools`, `model`).

### Agent Not Auto-Invoking

**Issue**: Agent exists but Claude doesn't use it automatically.

**Solution**: Add proactive trigger language to `description`:
- "PROACTIVELY use this agent when..."
- "MUST BE USED when..."
- Include specific trigger scenarios

### Tool Access Errors

**Issue**: Agent tries to use a tool not in its `tools` list.

**Solution**: Add the required tool to the `tools` field in YAML frontmatter.

## Version History

- **v2.0 (2025-01-17)**: Split gap-analysis into two focused agents
  - gap-analysis: Phases 0-0.5 (analysis and review)
  - jira-story-creator: Phases 1-5 (Jira story creation)
  - Added cross-references between agents
  - Improved separation of concerns

- **v1.0 (2025-01-14)**: Initial agent collection
  - gap-analysis (combined workflow)
  - schema-documentation
  - react-mf-agent
  - java-quarkus-agent
  - code-quality-reviewer

## Contributing

When adding or modifying agents:

1. Follow YAML frontmatter structure
2. Include proactive trigger language
3. Specify explicit tool list
4. Keep agents focused (single responsibility)
5. Add cross-references to related agents
6. Document clear activation scenarios
7. Test automatic invocation

## License

[Your License Here]

## Support

For issues or questions about these agents, please [create an issue](#) or contact the maintainers.
