# Claude Code Agents, Skills & Commands

A collection of specialized AI agents, expert skills, and workflow commands for Claude Code CLI to automate complex development workflows.

## Overview

This repository contains production-ready extensions that enhance Claude Code's capabilities for AWS serverless development, React micro-frontends, Java/Quarkus applications, infrastructure-as-code, technical design, gap analysis, and Jira story creation.

The extensions are organized into three categories:

- **Agents** — Autonomous subprocesses that scaffold projects, analyze codebases, and generate artifacts
- **Skills** — Expert consultants invoked inline for code review, architecture guidance, and troubleshooting
- **Commands** — Slash commands (`/command-name`) for common workflow tasks like fetching Jira issues, creating PRs, and reviewing code

## Feature Analysis Pipeline

A 5-step pipeline that takes a Confluence spec page and turns it into Jira stories with full gap analysis:

```
/extract-critical-path → /extract-feature-designs → /feature-gap-analysis → /industry-standards-review → /create-jira-stories
```

**See [PIPELINE-GUIDE.md](PIPELINE-GUIDE.md) for the complete how-to**, including:
- Setting up the `repos/` directory with code checkouts
- Writing a `REPO_SUMMARY.md` (critical for accurate gap analysis)
- Running each step with parameters
- Reviewing outputs between steps
- Tips for better results

---

## Available Agents

### 1. **gap-analysis**
Performs multi-dimensional gap analysis across code repositories, schemas, scenarios, and UI designs.

**Use Cases:**
- Analyzing AWS serverless implementations (Lambda, DynamoDB, AppSync, React)
- Validating schema-to-code alignment
- Checking GAAP compliance for financial systems
- Validating TypeScript, React, GraphQL, and AWS Lambda best practices
- Identifying missing implementations and inconsistencies

**Triggers:** Automatically invoked when you request gap analysis, implementation validation, or compliance checking.

**Output:** Comprehensive gap report with prioritized findings and proposed story titles for user approval.

**Next Step:** Use `jira-story-creator` agent to convert approved findings to Jira.

---

### 2. **jira-story-creator**
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

### 3. **schema-documentation**
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

### 4. **react-mf-scaffolder**
Scaffolds new React Module Federation micro-frontend projects from scratch following bulletproof-react architecture.

**Use Cases:**
- Scaffolding new Module Federation micro-frontends
- Creating feature modules with GraphQL integration
- Implementing Zustand state management
- Setting up React Query for server state
- Configuring Playwright E2E and Vitest unit tests

**Triggers:** Automatically invoked when you request React Module Federation project scaffolding.

**Note:** For code review, architecture consultation, or working with existing code, use the `react-mf-expert` **skill** instead.

**Stack:**
- Module Federation with Vite
- GraphQL with codegen
- Zustand + React Query
- React Hook Form
- Playwright + Vitest

---

### 5. **java-quarkus-scaffolder**
Scaffolds new Java/Quarkus projects and components following best practices.

**Use Cases:**
- Creating new Quarkus REST API projects
- Generating service components with database integration
- Setting up Kafka messaging integration
- Implementing CRUD operations with security

**Triggers:** Automatically invoked when you request Quarkus project scaffolding.

**Note:** For code review, architecture consultation, or working with existing code, use the `java-quarkus-expert` **skill** instead.

**Stack:**
- Quarkus framework
- Gradle build system
- Spotless (Google Java Style Guide)
- JUnit 5, AssertJ, Mockito
- Security best practices (OWASP Top 10)

**External Rules:** Consults `~/.claude/java_rules.md` for comprehensive Java development guidelines.

---

### 6. **code-quality-reviewer**
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

### 7. **adr-compliance-reviewer**
Analyzes repositories for compliance with accepted Architecture Decision Records (ADRs).

**Use Cases:**
- Verifying new services follow architectural guidelines
- Pre-release compliance checks
- Auditing ADR adherence across a codebase

**ADRs Checked:**
- ADR-001: Prefixed Base62 Entity Identifiers
- ADR-002: Backend For Frontend with AppSync
- ADR-003: React/Vite Frontend
- ADR-004: Module Federation Micro Frontends
- ADR-005: Zustand State Management

**Triggers:** Automatically invoked when you request ADR compliance analysis or before major releases.

**Output:** Detailed compliance report with specific `file:line` references for violations.

---

### 8. **tech-design**
Creates comprehensive technical design documentation for AWS serverless applications following a Technical Review Checklist.

**Use Cases:**
- Planning new AWS serverless features before development
- Documenting existing architecture for knowledge transfer
- Generating architecture diagrams (Mermaid/PlantUML/ASCII)
- Documenting data models (DynamoDB), API contracts, security flows, and capacity planning
- Validating design completeness against a checklist

**Triggers:** Automatically invoked when planning new features or documenting existing systems.

**Output:** Markdown design document ready for technical review. Can feed into `gap-analysis` agent.

---

### 9. **qa-testing-agent**
Guides testers through the complete QA lifecycle — from story intake through test execution, results formatting, and Jira posting.

**Use Cases:**
- Generating test plans from Jira story acceptance criteria
- Selecting mobile device test matrices
- Formatting test results for Jira comments
- Posting QA results to Jira issues
- Translation testing verification

**Triggers:** Automatically invoked when you request QA testing guidance, test plan creation, or test results formatting.

**Output:** Structured test plans, formatted test results, and Jira comments.

---

### 10. **routing-agent**
SDLC orchestration agent that coordinates the complete software development lifecycle — planning, implementation, review, and delivery.

**Use Cases:**
- Building complete software projects that require multi-phase coordination
- Dispatching work to language-specific subagents (Python, TypeScript, Java/Quarkus, Terraform, Go, React)
- Orchestrating functional and code quality reviews with retry loops
- Handling git commits and PR creation

**Triggers:** Automatically invoked when building complete software projects that require planning, implementation, review, and delivery.

**Subagents:** python-agent, typescript-agent, java-quarkus-agent, terraform-agent, golang-agent, react-agent, functional-reviewer, code-quality-reviewer, adr-compliance-reviewer.

---

### 11. **terraform-agent**
Generates Terraform infrastructure as code following AWS best practices with proper state management, security, and testing.

**Use Cases:**
- Creating new Terraform project scaffolding for AWS deployments
- Generating infrastructure modules and resources
- Setting up state management, security scanning, and linting

**Triggers:** Automatically invoked when you request Terraform infrastructure generation.

**Stack:**
- Terraform (latest stable)
- AWS provider
- tflint, checkov/tfsec
- terraform-docs
- terratest

**External Rules:** Consults `~/.claude/terraform_rules.md` for comprehensive Terraform development guidelines.

---

## Available Skills

Skills are expert consultants that run inline (not as subagents). They provide guidance, review, and troubleshooting without generating full project scaffolds.

### 1. **java-quarkus-expert**
Expert consultant for Java/Quarkus application development with Gradle.

**Use For:** Code review, architectural guidance, implementation consulting, pattern validation, troubleshooting, testing strategy, and security review.

**Scaffolding?** Use the `java-quarkus-scaffolder` agent instead.

---

### 2. **react-mf-expert**
Expert consultant for React Module Federation micro-frontends using bulletproof-react architecture patterns.

**Use For:** Code review, architectural guidance, implementation consulting, pattern validation, troubleshooting Module Federation/GraphQL/state management, and ESLint/config review.

**Scaffolding?** Use the `react-mf-scaffolder` agent instead.

---

### 3. **react-testing-expert**
Expert consultant for comprehensive React testing strategies.

**Use For:** Testing strategy, mocking patterns, test data generation with Faker.js, coverage guidance, and debugging failing tests.

**Covers:** Unit tests (Vitest), integration tests (React Testing Library), E2E tests (Playwright), and API tests (GraphQL).

---

## Available Commands

Commands are slash commands invoked as `/command-name` (or `/command-name <arguments>`) for common workflow tasks.

| Command | Description |
|---------|-------------|
| `/catchup` | Git diff this branch against main/master to build context |
| `/catchUpAndGetJira <issue-key>` | Build branch context via git diff + fetch Jira issue details |
| `/get-jira <issue-key>` | Fetch Jira issue details (summary, description, status, priority) |
| `/getConfluencePage <page-id\|url\|title>` | Fetch and render a Confluence page as markdown (optional `--prompt` for analysis) |
| `/getPRComments <pr-number>` | Fetch GitHub PR comments and analyze codebase in context (optional `--author` filter) |
| `/codereview <pr-number>` | Pull down a PR and run the code-quality-reviewer agent on it |
| `/codeReviewUpdate <commit-sha>` | Re-review after changes have been made to a PR |
| `/create-pr` | Add, commit, push, and create a pull request via GitHub CLI |
| `/reviewitadr` | Run the adr-compliance-reviewer agent on the current repository |
| `/java-branch-refactor` | Analyze the git diff for this branch and identify refactoring opportunities (Java/Quarkus) |
| `/mergeandresolve` | Merge master and resolve conflicts, then verify build/lint/tests pass |
| `/extract-critical-path <page-id>` | Extract features, ACs, and Figma links from a Confluence spec page (Pipeline Step 1) |
| `/extract-feature-designs` | Extract Figma design specs per feature from Step 1 output (Pipeline Step 2) |
| `/feature-gap-analysis --feature-code=CODE` | Compare features + designs against repo code to identify gaps (Pipeline Step 3) |
| `/industry-standards-review` | Compare gap report against industry standards and best practices (Pipeline Step 4) |
| `/create-jira-stories --initiative=KEY` | Create Jira epic, stories, subtasks, and dependency links from gap report (Pipeline Step 5) |
| `/post-jira-comment <issue-key>` | Post a comment to a Jira issue via REST API |
| `/qa-test-plan` | Generate a QA test plan from story context, branch diff, and PR changes |
| `/createReview [--omit=N,...] [--approve]` | Post a GitHub PR review with inline comments from a prior `/codereview` run |
| `/figma-extract <figma-url>` | Extract Figma design specs (frames, components, tokens) for offline analysis |
| `/getLatestClaudeReleaseNotes [version]` | Fetch the latest Claude Code release notes from GitHub |

---

## Installation

### Project-Level (Recommended for Teams)

Copy the directories to your project's `.claude/` directory:

```bash
mkdir -p .claude/agents .claude/commands .claude/skills
cp agents/*.md .claude/agents/
cp commands/*.md .claude/commands/
cp skills/*.md .claude/skills/
```

### User-Level (Available Across All Projects)

Copy to your home directory:

```bash
mkdir -p ~/.claude/agents ~/.claude/commands ~/.claude/skills
cp agents/*.md ~/.claude/agents/
cp commands/*.md ~/.claude/commands/
cp skills/*.md ~/.claude/skills/
```

## Usage

### Automatic Invocation (Recommended)

Simply describe what you want to accomplish, and Claude will automatically invoke the appropriate agent or skill:

```bash
# Triggers gap-analysis agent
"Analyze gaps in my AWS Lambda implementation"

# Triggers jira-story-creator agent
"Create Jira stories from these approved gaps"

# Triggers react-mf-scaffolder agent
"Scaffold a new Module Federation project for user profiles"

# Triggers java-quarkus-scaffolder agent
"Generate a Quarkus REST API for order management"

# Triggers schema-documentation agent
"Generate documentation for this JSON schema"

# Triggers code-quality-reviewer agent
"Review the code quality of my recent changes"

# Triggers tech-design agent
"Create a technical design document for the new notifications feature"

# Triggers adr-compliance-reviewer agent
"Check this repo for ADR compliance"

# Triggers qa-testing-agent
"Help me test PROJ-456"

# Triggers terraform-agent
"Generate Terraform for an S3 bucket with CloudFront"
```

### Slash Commands

```bash
/get-jira PROJ-123
/catchup
/codereview 42
/create-pr
/reviewitadr
/getConfluencePage 12345678 --prompt="summarize the critical path"
```

### Skills (Inline Expert Consultation)

```bash
# Triggers java-quarkus-expert skill
"Review this Quarkus service for best practices"

# Triggers react-mf-expert skill
"Should I use Zustand or React Query for this state?"

# Triggers react-testing-expert skill
"Help me write Playwright tests for the login flow"
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

### Key Design Principles
- **Proactive triggers** for automatic invocation
- **Explicit tool restrictions** for security
- **Clear activation scenarios** in descriptions
- **Cross-references** between related agents and skills
- **Focused, single-responsibility** design
- **Agent/Skill separation**: Agents scaffold, Skills consult

## Workflows

### Complete Gap-to-Jira Workflow

1. **Gap Analysis Phase**
   ```
   User: "Analyze gaps between my schemas and Lambda implementations"
   -> gap-analysis agent analyzes code, schemas, scenarios
   -> Presents findings and proposed stories
   -> User approves/revises story list
   ```

2. **Jira Creation Phase**
   ```
   User: "Create Jira stories from approved gaps"
   -> jira-story-creator agent creates epics and stories
   -> Links dependencies with "Blocks" relationships
   -> Documents constraints and acceptance criteria
   ```

### Direct Schema-to-Jira (Skip Gap Analysis)

```
User: "Create Jira stories from api-schema.json"
-> jira-story-creator agent reads schema directly
-> Generates implementation stories
-> No gap analysis needed
```

### Tech Design to Gap Analysis

```
User: "Create a technical design for the new billing feature"
-> tech-design agent interviews, scans code, generates design doc
-> User approves design
User: "Now analyze gaps against the design"
-> gap-analysis agent uses design doc as input
```

### React Development with Review

```
/react-mf-scaffolder (scaffold project)
  -> react-mf-expert skill (architecture guidance)
  -> react-testing-expert skill (testing strategy)
  -> code-quality-reviewer agent (validate quality)
```

### Branch Workflow with Jira Context

```
/catchUpAndGetJira PROJ-123
  -> Builds branch diff context + fetches Jira details
  -> Work on the feature...
/codereview 42
  -> Reviews the PR
/mergeandresolve
  -> Merges master and resolves conflicts
```

## Configuration

### Environment Variables (for Jira & Confluence)

Required for `jira-story-creator` agent, `/get-jira`, `/catchUpAndGetJira`, and `/getConfluencePage` commands:

```bash
export JIRA_USER_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_BASE_URL="your-company.atlassian.net"
```

### External Rules

- **java-quarkus-scaffolder** references `~/.claude/java_rules.md` for comprehensive Java development guidelines. Ensure this file exists if using the Java agent.

## Best Practices

### When to Use Each Extension

| Scenario | Extension | Type |
|----------|-----------|------|
| "Is my implementation complete?" | gap-analysis | Agent |
| "Create Jira tasks from requirements" | jira-story-creator | Agent |
| "Document this schema" | schema-documentation | Agent |
| "Scaffold a React micro-frontend" | react-mf-scaffolder | Agent |
| "Scaffold a Quarkus service" | java-quarkus-scaffolder | Agent |
| "Review my code quality" | code-quality-reviewer | Agent |
| "Check ADR compliance" | adr-compliance-reviewer | Agent |
| "Create a technical design doc" | tech-design | Agent |
| "Help me test this Jira story" | qa-testing-agent | Agent |
| "Build a complete project" | routing-agent | Agent |
| "Generate Terraform for this infra" | terraform-agent | Agent |
| "Review this Java code" | java-quarkus-expert | Skill |
| "Help with React MF architecture" | react-mf-expert | Skill |
| "Help me write tests" | react-testing-expert | Skill |
| "What changed on this branch?" | /catchup | Command |
| "Get Jira issue details" | /get-jira | Command |
| "Create a pull request" | /create-pr | Command |

### Agent vs. Skill

- **Use an Agent** when you need something **generated** — a new project, a report, Jira stories, documentation
- **Use a Skill** when you need **expert advice** — code review, architecture guidance, troubleshooting

## Customization

### Modifying Extensions

All extensions are markdown files with clear section structure:

1. **YAML Frontmatter**: Metadata and configuration
2. **Overview**: Purpose and use cases
3. **Workflow**: Step-by-step process
4. **Patterns**: Technical implementation patterns
5. **Examples**: Usage examples and templates

Edit any `.md` file to customize behavior, add patterns, or adjust workflows.

### Adding New Extensions

**Agent** — Create a new `.md` file in `agents/`:

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

**Skill** — Create a new `.md` file in `skills/`:

```markdown
---
name: your-skill-name
description: |
  Expert consultant for...
model: sonnet
---

# Your Skill Name

[Skill instructions here...]
```

**Command** — Create a new `.md` file in `commands/`:

```markdown
---
description: Short description of the command
argument-hint: [optional-args]
allowed-tools: Bash(git:*), Read, Glob
---

[Command instructions using $ARGUMENTS for user input...]
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

### Command Not Found

**Issue**: Slash command doesn't appear or doesn't work.

**Solution**: Ensure the `.md` file is in the `commands/` directory (project-level or user-level) and has a valid `description` in the frontmatter.

## Version History

- **v4.0 (2026-02)**: Pipeline, new agents, and expanded commands
  - Added `PIPELINE-GUIDE.md` — comprehensive 5-step feature analysis pipeline how-to
  - Added `qa-testing-agent` for QA lifecycle guidance, test plans, and Jira result posting
  - Added `routing-agent` for SDLC orchestration across language-specific subagents
  - Added `terraform-agent` for Terraform IaC generation with AWS best practices
  - Major rewrite of `jira-story-creator` agent
  - Added 11 new slash commands: `/extract-critical-path`, `/extract-feature-designs`, `/feature-gap-analysis`, `/industry-standards-review`, `/create-jira-stories`, `/post-jira-comment`, `/qa-test-plan`, `/createReview`, `/figma-extract`, `/getLatestClaudeReleaseNotes`, `/codeReviewUpdate`

- **v3.0 (2025-02)**: Added skills, commands, and new agents
  - Added `skills/` directory with expert consultants (java-quarkus-expert, react-mf-expert, react-testing-expert)
  - Added `commands/` directory with 11 workflow slash commands
  - Added `adr-compliance-reviewer` agent
  - Added `tech-design` agent
  - Renamed `react-mf-agent` to `react-mf-scaffolder` (consulting moved to react-mf-expert skill)
  - Renamed `java-quarkus-agent` to `java-quarkus-scaffolder` (consulting moved to java-quarkus-expert skill)

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

When adding or modifying extensions:

1. Follow YAML frontmatter structure
2. Include proactive trigger language (agents)
3. Specify explicit tool list (agents)
4. Keep extensions focused (single responsibility)
5. Add cross-references to related agents/skills
6. Document clear activation scenarios
7. Test automatic invocation

## License

[Your License Here]

## Support

For issues or questions about these extensions, please [create an issue](#) or contact the maintainers.
