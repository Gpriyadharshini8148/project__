# Test Data Excel Structure

## TestData.xlsx Expected Structure

### Sheet 1: TestSuites
Defines which test suites to run

| SpecFile | Description | Tags | Environment | ExecutionFlag |
|----------|-------------|------|-------------|---------------|
| customer-journey | New customer application flow | smoke,e2e | QA | yes |
| admin-approval | Admin approval workflow | admin | QA | yes |
| post-approval | Post approval flow | approval | QA | yes |

### Sheet 2: TestData
Contains test data for each suite

**Format:** Each test suite should have a header row followed by data rows

```
TC_01_customer-journey
Environment | ExecutionFlag | APPURLCUSTOMERLOGIN | USERNAMECUSTOMERLOGIN | ...
QA          | yes          | https://example.com | testuser             | ...

TC_02_admin-approval
Environment | ExecutionFlag | APPURLADMIN | USERNAMEADMIN | ...
QA          | yes          | https://admin.example.com | admin | ...

TC_03_post-approval
Environment | ExecutionFlag | APPURLCUSTOMERLOGIN | USERNAMECUSTOMERLOGIN | ...
QA          | yes          | https://example.com | testuser | ...
```

**Important:**
- Suite headers must start with `TC_##_` followed by the spec file name (without .spec.ts)
- Column names will be converted to camelCase (e.g., `APPURLCUSTOMERLOGIN` → `appurlcustomerlogin`)
- Each suite can have multiple data rows for data-driven tests
- Set `ExecutionFlag` to `yes` to run that specific row

## Environment Variables (.env)
Alternative to Excel, you can use environment variables:

```
FOS_URL=https://example.com
FOS_USERNAME=testuser
FOS_PASSWORD=testpass
ADMIN_URL=https://admin.example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpass
```
