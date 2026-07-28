qac-xray-test-case-guide.md

// NODE

Changes have been made:
https://github.com/fullbay/prt-main-uix/pull/408

  and the:
  PARTS-1266-TDD-PLAN.md
  has been udpated.

  Let's read the plan and get the diff, to verify that we have met the Stories description/AC.

  Take the diff and use the code-quality-reviewer, adr-compliance-reviewer, security-reviewer, performance-reviewer and functional-reviewer

  Create a new Section "Code Review", or relevant title verbiage in the
  PARTS-1266-TDD-PLAN.md

  and put any relevant comments/observations

  fan out subagents as needed.



// REACT

Changes have been made:
https://github.com/fullbay/prt-main-uix/pull/418


  and the:
  PARTS-1524-PLAN.md

  has been udpated.

  Let's read the plan and updates and get the diff, to verify that we have met the Stories description/AC.
  Test Using Playwright MCP (see claude.md for auth) and verify

  Take the diff and use the code-quality-reviewer, react-mf-expert, adr-compliance-reviewer, security-reviewer, performance-reviewer and functional-reviewer

  Create a new Section "Code Review" in the
  PARTS-1524-PLAN.md
  and put any relevant comments/observations

  fan out subagents as needed.



Changes have been made:
https://github.com/fullbay/prt-purchase-orders-svc/pull/172

  and the:
PARTS-1546-TDD-PLAN.md

  has been udpated.

  Let's read the plan and get the diff, to verify that we have met the Stories description/AC.

  Take the diff and use the code-quality-reviewer, adr-compliance-reviewer, security-reviewer, java-quarkas-agent, performance-reviewer and functional-reviewer

  Create a new Section "Code Review" in the
PARTS-1546-TDD-PLAN.md

  and put any relevant comments/observations

  fan out subagents as needed.

// REACT
Let's put a plan/todo's together to implement.  Write in a markdown file, this will be used by another claude session running Opus.

  Include in the plan:
  create a git branch from the repo(s) in the CWD

  Let's approach this work via three phases RED, GREEN and REFACTOR, e.g. TDD
  Include any prep work in a Phase: Prep. So Prep => RED => GREEN => REFACTOR
  Wait for each Phase tests to red/green relevant to the phase itself

  For RED:
  Create a happy and sad path test(s) that encapsulate the functionality which then fail.
  present the names of the happy/sad path tests at the completion of writing the plan.

  verify the test failed and or use Playwright to verify failure

  For GREEN:
  write the code to get the tests to pass.
  verify functionality using Playwright/Chrome MCP

  For REFACTOR
  Holistically look at the diff and see if there are oportunities to refactor, any recommendations should be
  in-line/congruent with current patterns.
  verify functionality using Playwright/Chrome MCP 

  Open a PR for RED and update the PR description with each Phase after commit
  - You might need to do a --no-verify on the RED to commit the PR, but make sure it's failing for our new tests and for the right reasons.


  Does that make sense?



Let's put a plan/todo's together to implement.  Write in a markdown file, this will be used by another claude
  session running sonnet.

  Include in the plan:
  create a git branch and worktree, sourcing from the repo in the CWD and place the worktree within the CWD directory.

  Let's approach this work via three phases RED, GREEN and REFACTOR, e.g. TDD
  Include any prep work in a Phase: Prep. So Prep => RED => GREEN => REFACTOR

  For RED:
  Create a happy and sad path test(s) that encapsulate the functionality which then fail.

  verify the test failed

  For GREEN:
  write the code to get the tests to pass.
  verify functionality using Playwright/Chrome MCP

  For REFACTOR
  Holistically look at the diff and see if there are oportunities to refactor, any recommendations should be
  in-line/congruent with current patterns.
  verify functionality using Playwright/Chrome MCP 

  Open a Draft PR for RED (it will fail in the pipeline) and update the PR description with each Phase after commit


  Does that make sense?

changes have been made, let's verify that they satisfy the Description/AC : https://github.com/fullbay/ven-main-uix/pull/61

  also launch the code-quality-reviewer and react-mf-expert and review the diff/changes

  fan out subagents

 Lets analyze and create a Plan/TODO's in a markdown file, this will be used by another claude session running sonnet.

  Include in the plan:
  create a git branch

  Let's approach this work via three phases RED, GREEN and REFACTOR, e.g. TDD

  For RED:
  Create a happy and sad path test(s) that encapsulate the functionality which then fail. Let's create an Integration test for this only.  I want this
  to fail in the pipeline and if we add the unit tests at this stage, the build will fail and wont' run the integration tests.
  
  present the names of the happy/sad path tests at the completion of writing the plan.

  For GREEN:
  write the code to get the tests to pass.
  also add the happy/sad unit tests at this stage
  additionally add the contract tests as well

  For REFACTOR
  Holistically look at the diff and see if there are oportunities to refactor, any recommendations should be in-line/congruent with current patterns.


  Open a PR after RED (it will fail in the pipeline) and on subsequent stages, update the PR verbiage
  Wait for the integration tests (Step "Run Integration Tests") to RED in the pipeline before moving to GREEN
  Wait for the integration tests (Step "Run Integration Tests") to PASS in the pipeline before moving to REFACTOR
  Wait for the integration tests (Step "Run Integration Tests") to PASS in the pipeline after REFACTOR has been committed
  Use the Harness MCP

  Does that make sense?




 Lets analyze and create a Plan/TODO's in a markdown file, this will be used by another claude session running sonnet.
 Lets analyze and create a Plan/TODO's in a markdown file, this will be used by another claude session running Opus 5.

  Include in the plan:
  create a git branch and worktree, sourcing from the repo in the CWD and place the worktree within the CWD directory.

  Let's approach this work via three phases RED, GREEN and REFACTOR, e.g. TDD

  For RED:
  Create a happy and sad path test(s) that encapsulate the functionality which then fail. Let's create an Integration test for this only.  I want this
  to fail in the pipeline and if we add the unit tests at this stage, the build will fail and wont' run the integration tests.

  Present the names of the happy/sad path tests at the completion of writing the plan.

  For GREEN:
  write the code to get the tests to pass.
  also add the happy/sad unit tests at this stage
  additionally add the contract tests as well

  For REFACTOR
  Holistically look at the diff and see if there are oportunities to refactor, any recommendations should be in-line/congruent with current patterns.


  Open a PR after RED (it will fail in the pipeline) and on subsequent stages, update the PR verbiage
  Wait for the integration tests (Step "Run Integration Tests") to RED in the pipeline before moving to GREEN
  Wait for the integration tests (Step "Run Integration Tests") to PASS in the pipeline before moving to REFACTOR
  Wait for the integration tests (Step "Run Integration Tests") to PASS in the pipeline after REFACTOR has been committed
  Use the Harness MCP

  Does that make sense?

Playwright QA Auth for platform.qa.fullbay.com

The ?t=TOKEN URL approach in the PLAYWRIGHT-QA-AUTH.md does not work with the sign-up-or-in-multiple-tenant flow — the Descope component never intercepts the parameter. Use this 3-step sequence instead:

Step 1 — Generate a token (Bash tool):
QA_PROJECT_ID="P3A4p3XFtTZPcarBYCp6NsCU8KZn"
MGMT_KEY=$(grep DESCOPE_MANAGEMENT_KEY /Users/scottjones/code/fb-parts/prt-main-uix/.env.local.test | cut -d= -f2)
TOKEN=$(curl -s \
  -X POST "https://api.descope.com/v1/mgmt/user/signin/embeddedlink" \
  -H "Authorization: Bearer ${QA_PROJECT_ID}:${MGMT_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"loginId\": \"scott.jones@fullbay.com\", \"customClaims\": {}}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "$TOKEN"

Step 2 — Navigate to QA (any page) and call magicLink.verify directly (browser_evaluate):
async () => {
  const el = document.querySelector('descope-wc');
  const result = await el.sdk.magicLink.verify('PASTE_TOKEN_HERE');
  if (!result.ok) return 'verify failed: ' + JSON.stringify(result);
  const { sessionJwt, refreshJwt, cookieMaxAge } = result.data;
  const expires = new Date(Date.now() + cookieMaxAge * 1000).toUTCString();
  document.cookie = `DS=${sessionJwt}; path=/; SameSite=Strict; expires=${expires}`;
  document.cookie = `DSR=${refreshJwt}; path=/; SameSite=Strict; expires=${new Date(Date.now() + 12*60*60*1000).toUTCString()}`;
  return 'cookies set: ' + document.cookie.includes('DS=');
}
Wait for the token — it's single-use with a ~2 min TTL, so generate immediately before this step.

Step 3 — Navigate to your target URL (plain, no ?t=):
https://platform.qa.fullbay.com/parts
The DS/DSR cookies persist for the session (~12h on DSR). No re-auth needed across navigations.

Why the URL approach fails: the descope-wc component on this app uses flow-id=sign-up-or-in-multiple-tenant, which doesn't auto-handle the t query param. Calling sdk.magicLink.verify() directly bypasses the flow and writes the session cookies.

// DEV

Playwright DEV Auth for platform.dev.fullbay.com

The ?t=TOKEN URL approach in the PLAYWRIGHT-DEV-AUTH.md does not work with the sign-up-or-in-multiple-tenant flow — the Descope component never intercepts the parameter. Use this 3-step sequence instead:

Step 1 — Generate a token (Bash tool):
DEV_PROJECT_ID="P3A4p3XFtTZPcarBYCp6NsCU8KZn"
MGMT_KEY=$(grep DESCOPE_MANAGEMENT_KEY /Users/scottjones/code/fb-parts/prt-main-uix/.env.local.test | cut -d= -f2)
TOKEN=$(curl -s \
  -X POST "https://api.descope.com/v1/mgmt/user/signin/embeddedlink" \
  -H "Authorization: Bearer ${DEV_PROJECT_ID}:${MGMT_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"loginId\": \"scott.jones@fullbay.com\", \"customClaims\": {}}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "$TOKEN"

Step 2 — Navigate to DEV (any page) and call magicLink.verify directly (browser_evaluate):
async () => {
  const el = document.querySelector('descope-wc');
  const result = await el.sdk.magicLink.verify('PASTE_TOKEN_HERE');
  if (!result.ok) return 'verify failed: ' + JSON.stringify(result);
  const { sessionJwt, refreshJwt, cookieMaxAge } = result.data;
  const expires = new Date(Date.now() + cookieMaxAge * 1000).toUTCString();
  document.cookie = `DS=${sessionJwt}; path=/; SameSite=Strict; expires=${expires}`;
  document.cookie = `DSR=${refreshJwt}; path=/; SameSite=Strict; expires=${new Date(Date.now() + 12*60*60*1000).toUTCString()}`;
  return 'cookies set: ' + document.cookie.includes('DS=');
}
Wait for the token — it's single-use with a ~2 min TTL, so generate immediately before this step.

Step 3 — Navigate to your target URL (plain, no ?t=):
https://platform.dev.fullbay.com/
The DS/DSR cookies persist for the session (~12h on DSR). No re-auth needed across navigations.

Why the URL approach fails: the descope-wc component on this app uses flow-id=sign-up-or-in-multiple-tenant, which doesn't auto-handle the t query param. Calling sdk.magicLink.verify() directly bypasses the flow and writes the session cookies.

// localhost

Playwright localhost Auth for localhost:8090

The ?t=TOKEN URL approach in the PLAYWRIGHT-LOC-AUTH.md does not work with the sign-up-or-in-multiple-tenant flow — the Descope component never intercepts the parameter. Use this 3-step sequence instead:

Step 1 — Generate a token (Bash tool):
LOC_PROJECT_ID="P3A4p3XFtTZPcarBYCp6NsCU8KZn"
MGMT_KEY=$(grep DESCOPE_MANAGEMENT_KEY /Users/scottjones/code/fb-parts/prt-main-uix/.env.local.test | cut -d= -f2)
TOKEN=$(curl -s \
  -X POST "https://api.descope.com/v1/mgmt/user/signin/embeddedlink" \
  -H "Authorization: Bearer ${LOC_PROJECT_ID}:${MGMT_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"loginId\": \"scott.jones@fullbay.com\", \"customClaims\": {}}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "$TOKEN"

Step 2 — Navigate to localhost (any page) and call magicLink.verify directly (browser_evaluate):
async () => {
  const el = document.querySelector('descope-wc');
  const result = await el.sdk.magicLink.verify('PASTE_TOKEN_HERE');
  if (!result.ok) return 'verify failed: ' + JSON.stringify(result);
  const { sessionJwt, refreshJwt, cookieMaxAge } = result.data;
  const expires = new Date(Date.now() + cookieMaxAge * 1000).toUTCString();
  document.cookie = `DS=${sessionJwt}; path=/; SameSite=Strict; expires=${expires}`;
  document.cookie = `DSR=${refreshJwt}; path=/; SameSite=Strict; expires=${new Date(Date.now() + 12*60*60*1000).toUTCString()}`;
  return 'cookies set: ' + document.cookie.includes('DS=');
}
Wait for the token — it's single-use with a ~2 min TTL, so generate immediately before this step.

Step 3 — Navigate to your target URL (plain, no ?t=):
http://localhost:8090
The DS/DSR cookies persist for the session (~12h on DSR). No re-auth needed across navigations.

Why the URL approach fails: the descope-wc component on this app uses flow-id=sign-up-or-in-multiple-tenant, which doesn't auto-handle the t query param. Calling sdk.magicLink.verify() directly bypasses the flow and writes the session cookies.

