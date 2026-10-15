## What this PR does

<!-- One or two sentences. What works after this merges that did not work before? -->

## Requirements covered

<!-- List the FR ids from docs/SRS.md, e.g. FR-PRD-01, FR-PRD-03. -->

## Verification

```bash
./mvnw clean verify
```

- [ ] `./mvnw clean verify` passes locally
- [ ] Every new or changed endpoint was exercised through the gateway on port 8080, not the service port

<!-- Paste the JaCoCo line-coverage figure for the module you touched. -->
Coverage for this module: ____%

---

## Checklist

Tick every box or say why it does not apply. A PR with unticked boxes and no explanation gets sent back.

**Contract and API**
- [ ] Endpoints, request and response shapes match `docs/api-contract.md` exactly
- [ ] Any contract change was agreed with the other two developers *before* this PR
- [ ] Correct status codes: 200 / 201 / 400 / 401 / 403 / 404 / 409

**Validation and errors**
- [ ] Every request field carries Jakarta Bean Validation annotations
- [ ] `@Valid` on every request body
- [ ] Errors surface through the shared `GlobalExceptionHandler` as `ApiError`
- [ ] No stack trace or raw exception message reaches the client

**Layering and standards**
- [ ] No business logic in controllers
- [ ] Javadoc on every class and every non-trivial public method
- [ ] Naming conventions and indentation consistent with the rest of the codebase
- [ ] No secret, password or JWT secret hardcoded or committed

**Tests — no tests, no merge**
- [ ] JUnit 5 + Mockito unit tests for the service layer
- [ ] MockMvc tests for controllers, covering the success path *and* a 400 validation failure
- [ ] Repository queries tested against H2
- [ ] Feign clients are mocked; no test starts another service
- [ ] All tests pass; nothing is `@Disabled` or `@Ignore`d to get a green build

**Service boundaries**
- [ ] No cross-service JPA relationship
- [ ] No cross-schema foreign key
- [ ] No second datasource in this service
- [ ] This service does not read another service's database
- [ ] No hardcoded service host or port; Feign resolves by Eureka logical name
- [ ] No `/api/**/internal/**` route is reachable through the gateway

**Runtime**
- [ ] Service registers with Eureka and appears at `http://localhost:8761`
- [ ] AOP logging aspect fires and a log file is written under `logs/`

---

## Notes for the reviewer

<!-- Anything surprising, deferred, or worth a second opinion. -->