# ShopSphere Collaboration Guide

## 1. Purpose

This document is the team-facing collaboration and development guide for
ShopSphere.

It consolidates the environment setup, Git workflow, Docker/MySQL
workflow, branch rules, Pull Request rules, service-boundary rules,
testing expectations, and daily development practices needed for the
three-developer project.

`BOOTSTRAP.md` is not required in the project. The environment and
onboarding information is maintained here instead.

---

# 2. Repository workflow

The repository uses three levels of branches:

```text
main
  │
  └── Milestone snapshots / final submission

develop
  │
  ├── feature/*
  ├── fix/*
  ├── docs/*
  ├── chore/*
  └── test/*
```

### `main`

`main` contains milestone snapshots only.

Do not develop directly on `main`.

### `develop`

`develop` is the team's integration branch.

All normal development starts from `develop`, and completed work is
merged back into `develop` through Pull Requests.

### Feature/fix branches

Every change must be made on a separate branch created from an
up-to-date `develop`.

Examples:

```text
feature/product-service
feature/cart-service
feature/order-checkout-flow
fix/cart-quantity-validation
docs/api-contract-update
chore/parent-pom-jacoco
test/product-service-tests
```

Use:

- `feature/` for new functionality
- `fix/` for bug fixes
- `docs/` for documentation
- `chore/` for maintenance/configuration
- `test/` for test-focused work

Use lowercase, hyphen-separated names.

---

# 3. Direct-push policy

**Nobody pushes directly to `main` or `develop`.**

Every change reaches these branches through a Pull Request.

The repository contains a local `pre-push` safety hook that blocks
pushes to:

```text
main
develop
```

This is a local safety mechanism. It is not server-side GitHub branch
protection.

A deliberate bypass such as:

```bash
git push --no-verify
```

can bypass the local hook.

Do not bypass it.

Because this is a private repository under a personal GitHub account on
the Free plan, the local hook is our development-time safety mechanism.
Contributors must follow the branch and PR policy even though GitHub
does not provide server-side protected-branch enforcement for this
setup.

---

# 4. Development environment

ShopSphere uses a reproducible GitHub Codespaces development
environment.

The repository provides:

- Java 21
- Maven Wrapper
- Docker
- Docker Compose
- persistent MySQL development database
- automatic Git hook configuration

The Spring Boot services run directly inside the Codespace.

MySQL runs in Docker.

The environment is:

```text
GitHub Codespace
└── Dev Container
    ├── Java 21
    ├── Maven Wrapper
    ├── Docker CLI
    └── Docker Compose
             │
             ▼
        MySQL 8.4
             │
             └── named Docker volume
```

Do not install a separate MySQL server inside the Dev Container.

Do not containerize the Spring Boot services as part of the normal
development setup.

---

# 5. Creating your development environment

## Step 1 --- Create a Codespace

Create a GitHub Codespace for the repository using the `develop` branch.

Do not start normal development from `main`.

The Dev Container configuration is already committed to the repository.

When the Codespace is created, the Dev Container automatically
configures the development environment and Git hooks.

## Quick start

Everything below in one block, for a Codespace that is already created:

```bash
cd "$(git rev-parse --show-toplevel)"
docker compose up -d                    # MySQL, creates the eight schemas
set -a; source .env; set +a             # only for this shell; setup.sh handles new ones
./mvnw clean install -DskipTests        # installs common-lib into ~/.m2
./mvnw -pl eureka-server spring-boot:run
```

`.env` is created for you by `.devcontainer/setup.sh` when the Codespace is
built, with generated values for `DB_PASSWORD` and `JWT_SECRET`. If it is
missing, run `bash .devcontainer/setup.sh`. Never copy `.env.example` values
verbatim — a committed secret is not a secret.

Or start the whole platform at once:

```bash
./scripts/start-all.sh
./scripts/stop-all.sh
```

---

## Step 2 --- Verify Java

From the repository root:

```bash
java -version
```

Java 21 must be reported.

---

## Step 3 --- Verify Maven

The project uses the Maven Wrapper.

Run:

```bash
./mvnw -version
```

Do not depend on a system Maven installation for project commands.

---

## Step 4 --- Verify Docker

Run:

```bash
docker --version
docker compose version
```

Both commands must work.

---

# 6. Configure local environment variables

Create the local environment file:

```bash
cp .env.example .env
```

Open it:

```bash
nano .env
```

Set your local development values:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-local-mysql-password
JWT_SECRET=your-long-local-jwt-secret
EUREKA_URI=http://localhost:8761/eureka
```

Use your own local values.

Never commit `.env`.

Only `.env.example` belongs in Git.

Do not share local passwords or JWT secrets in commits, Pull Requests,
or team chat.

---

# 7. Start MySQL

From the repository root:

```bash
docker compose up -d
```

Check the container:

```bash
docker compose ps
```

Wait until MySQL reports:

```text
healthy
```

You can inspect the logs with:

```bash
docker compose logs mysql --tail=50
```

A successful startup should contain a message equivalent to:

```text
ready for connections
```

The Compose setup uses:

- MySQL 8.4
- port `3306`
- a named Docker volume for persistence
- `db/01_create_schemas.sql` as the initial schema-creation script
- a health check
- `restart: unless-stopped`

---

# 8. Verify the ShopSphere databases

The project has eight service-owned databases:

```text
shopsphere_user
shopsphere_auth
shopsphere_product
shopsphere_cart
shopsphere_wishlist
shopsphere_order
shopsphere_payment
shopsphere_review
```

No MySQL client installation is required in the Dev Container.

Enter MySQL directly through the MySQL container:

```bash
docker compose exec mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'
```

Enter the MySQL password when prompted.

At the MySQL prompt:

```sql
SHOW DATABASES;
```

You should see the eight ShopSphere databases plus MySQL system
databases.

To enter a particular service database:

```sql
USE shopsphere_product;
```

Then:

```sql
SHOW TABLES;
```

At the initial project stage, tables may not exist yet. Hibernate
creates the service tables when the corresponding service starts and its
entities are present.

Exit MySQL with:

```sql
exit
```

---

# 9. MySQL persistence

MySQL data is stored in the named Docker volume:

```text
shopsphere-mysql-data
```

The volume is separate from the source code.

Stopping the container does not delete the database.

Normal shutdown:

```bash
docker compose stop
```

Start again:

```bash
docker compose up -d
```

The database data remains.

You can also recreate the MySQL container without deleting the volume:

```bash
docker compose down
docker compose up -d
```

## Important

Do **not** use this during normal development:

```bash
docker compose down -v
```

The `-v` option deletes the Docker volume and therefore deletes the
local MySQL data.

Use `down -v` only when you intentionally want to completely reset the
local database.

The Docker volume provides persistence within the developer's
Codespace/Docker environment. It is not a shared team database or a
substitute for production database storage.

Each developer should have their own local development database.

---

# 10. Build the complete project

From the repository root:

```bash
./mvnw clean install
```

For a faster build without tests:

```bash
./mvnw clean install -DskipTests
```

Use the Maven Wrapper for documented project commands.

---

# 11. Running Spring Boot services

Each service can be started from its own directory.

For example, start Eureka:

```bash
cd eureka-server
../mvnw spring-boot:run
```

Eureka:

```text
http://localhost:8761
```

Start the API Gateway from another terminal:

```bash
cd api-gateway
../mvnw spring-boot:run
```

Gateway:

```text
http://localhost:8080
```

Example business service:

```bash
cd product-service
../mvnw spring-boot:run
```

Product service:

```text
http://localhost:8083
```

To start everything in one command instead:

```bash
./scripts/start-all.sh
```

It loads `.env`, brings MySQL up and waits for the container to report
healthy, runs `./mvnw clean install -DskipTests` so `common-lib` is in `~/.m2`,
starts Eureka and waits until it answers `UP`, then launches the gateway and
services and waits for each one's `/actuator/health`.

```bash
./scripts/start-all.sh --all          # every module, not just the finished ones
./scripts/start-all.sh auth-service   # named modules only
./scripts/start-all.sh --no-build     # skip the Maven step
```

Stop them again:

```bash
./scripts/stop-all.sh                 # services only, MySQL keeps running
./scripts/stop-all.sh --with-db       # also stops the MySQL container
```

`stop-all.sh` sends SIGTERM first so each service deregisters from Eureka on
the way out. A killed instance lingers on the dashboard until it is evicted.

`DEFAULT_SERVICES` near the top of `start-all.sh` lists the modules a plain
`./scripts/start-all.sh` launches. **Add your service to that array when your
PR merges.**

The services use Eureka for service discovery.

Inter-service calls must use Feign with logical Eureka service names.

Do not hardcode service hostnames or ports for service-to-service
communication.

---

# 12. Load environment variables for Spring Boot

Docker Compose reads `.env` automatically, but a Spring Boot process
started from the terminal needs the variables to be available to its
shell environment.

Before starting services:

```bash
set -a
source .env
set +a
```

Verify non-secret values:

```bash
echo "$DB_HOST"
echo "$DB_USER"
echo "$EUREKA_URI"
```

Do not print:

```text
DB_PASSWORD
JWT_SECRET
```

Then start the required service, for example:

```bash
cd product-service
../mvnw spring-boot:run
```

---

# 13. Git hook configuration

The repository contains the pre-push hook at:

```text
scripts/git-hooks/pre-push
```

The Dev Container automatically configures Git to use the tracked hook
directory:

```bash
git config core.hooksPath "$(git rev-parse --show-toplevel)/scripts/git-hooks"
```

and makes the hook executable.

Verify:

```bash
git config --get core.hooksPath
```

Expected: an **absolute** path ending in `/scripts/git-hooks`.

The absolute path matters. Git resolves a relative `core.hooksPath` against the
current working directory, so with `scripts/git-hooks` configured, a push run
from inside a service folder finds no hook and goes through unblocked.
The hook blocks pushes to:

```text
main
develop
```

and allows normal development branches.

If the repository is cloned outside the provided Dev Container,
configure the hook manually:

```bash
git config core.hooksPath "$(git rev-parse --show-toplevel)/scripts/git-hooks"
chmod +x scripts/git-hooks/pre-push
```

Do not delete or bypass the hook.

---

# 14. Starting normal development

Always start from an up-to-date `develop`.

```bash
git checkout develop
git pull origin develop
```

Create your feature branch:

```bash
git checkout -b feature/your-change
```

Verify:

```bash
git branch --show-current
```

You should now be on your feature branch.

Never create a feature branch from an outdated local copy of `develop`.

---

# 15. Keeping your branch up to date

At least once per day:

```bash
git fetch origin
git rebase origin/develop
```

If your branch has already been pushed and the rebase rewrites its
history:

```bash
git push --force-with-lease
```

Never use:

```bash
git push --force
```

A feature branch should normally live no longer than two days.

---

# 16. Commit conventions

Use:

```text
type: short summary in the imperative
```

Examples:

```text
feat: add cart quantity validation
fix: reject checkout when the cart is empty
test: add ProductController MockMvc tests
docs: update review API contract
chore: update JaCoCo configuration
refactor: extract order total calculation
```

Allowed types:

```text
feat
fix
test
docs
chore
refactor
```

Keep the summary under 72 characters.

Describe what the change does, not what you personally did.

Good:

```text
feat: add wishlist move-to-cart endpoint
```

Avoid vague commits such as:

```text
added some stuff to wishlist
```

Commit regularly on your own branch.

---

# 17. Pull Requests

Every completed change is merged into `develop` through a Pull Request.

Open Pull Requests against:

```text
develop
```

Never target:

```text
main
```

Every PR requires at least one approval from another developer before
merging.

Use **Squash and merge**.

Delete the feature branch after the PR is merged.

The normal workflow is:

```text
develop
   │
   ├── feature/product-service
   │          │
   │          └── Pull Request
   │                    │
   │                    ▼
   ├────────────────> develop
   │
   └── feature/cart-service
              │
              └── Pull Request
                        │
                        ▼
                     develop
```

---

# 18. Service boundaries

Each service owns its own data.

Do not create cross-service JPA relationships such as:

```text
@ManyToOne
@OneToMany
```

between entities owned by different services.

Do not create:

- cross-schema foreign keys
- a second datasource inside a service
- cross-service JPA relationships
- direct database access to another service's schema
- hardcoded inter-service ports
- hardcoded inter-service host addresses

Service-to-service communication uses Feign and Eureka logical service
names.

The API Gateway is the public entry point.

Do not expose `/internal/**` routes through the gateway.

---

# 19. Shared code changes

The following areas affect everyone:

```text
pom.xml
common-lib/
docs/api-contract.md
```

Before changing shared code, announce the change in the team group.

A shared DTO change can break another service's Feign client.

An API contract change can affect multiple services and therefore
requires team coordination.

Do not silently modify shared contracts while working on an isolated
feature.

---

# 20. Testing requirements

Tests are part of the implementation.

A service PR should contain:

- service-layer JUnit/Mockito tests
- happy-path tests
- exception-path tests
- controller MockMvc tests
- validation-failure tests

Feign clients must be mocked in unit tests.

Tests use H2 rather than the development MySQL database.

Run the complete verification before opening or updating a PR:

```bash
./mvnw clean verify
```

The target coverage is 80%.

---

# 21. Service Definition of Done

A service PR is ready only when:

- [ ] Endpoints match `docs/api-contract.md`
- [ ] Bean Validation is present on request DTO fields
- [ ] Custom exceptions are handled by `GlobalExceptionHandler`
- [ ] No business logic exists in controllers
- [ ] Javadoc exists on classes and non-trivial public methods
- [ ] JUnit and Mockito tests cover happy and exception paths
- [ ] MockMvc tests cover success and validation failure
- [ ] `./mvnw clean verify` passes
- [ ] Service registers with Eureka
- [ ] Service connects to its own MySQL schema
- [ ] Service writes its log file under `logs/`
- [ ] No service-boundary violation exists
- [ ] No hardcoded inter-service address exists

---

# 22. Daily development rhythm

Time Action

---

Start of day Update `develop` and rebase your branch
During development Commit and push your own branch
Before PR Run `./mvnw clean verify`
End of day Open/update PR and review another developer's work
Day 5 and Day 9 Walkthrough --- explain another developer's module

Every developer should understand the complete system, not only their
assigned service.

---

# 23. Important commands --- quick reference

## Update develop

```bash
git checkout develop
git pull origin develop
```

## Create a feature branch

```bash
git checkout -b feature/your-change
```

## Update your feature branch

```bash
git fetch origin
git rebase origin/develop
```

## Start MySQL

```bash
docker compose up -d
```

## Check MySQL

```bash
docker compose ps
```

## View MySQL logs

```bash
docker compose logs mysql --tail=50
```

## Enter MySQL

```bash
docker compose exec mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'
```

## Stop MySQL without deleting data

```bash
docker compose stop
```

## Recreate MySQL container while retaining data

```bash
docker compose down
docker compose up -d
```

## Reset MySQL completely

Only when intentionally resetting local data:

```bash
docker compose down -v
docker compose up -d
```

## Build

```bash
./mvnw clean install
```

## Verify

```bash
./mvnw clean verify
```

## Start and stop everything

```bash
./scripts/start-all.sh
./scripts/stop-all.sh
```

## Check Git hook

```bash
git config --get core.hooksPath
```

Expected: an absolute path ending in `/scripts/git-hooks`.

## Check Git status

```bash
git status
```

---

# 24. Files that must never be committed

Never commit:

```text
.env
target/
logs/
IDE-specific files
local credentials
passwords
JWT secrets
```

Generated files must remain excluded by `.gitignore`.

---

# 25. Team collaboration rule

If you are unsure whether a change affects another service, the API
contract, the parent Maven configuration, `common-lib`, or database
ownership, discuss it with the team before implementing it.

The goal is not merely to make one service work.

The goal is to keep the complete ShopSphere system buildable, testable,
consistent, and understandable for all three developers.

---

# 26. New developer onboarding checklist

A developer is considered environment-ready when all of the following
are complete:

- [ ] Codespace created from `develop`
- [ ] Dev Container successfully created
- [ ] Java 21 verified
- [ ] Maven Wrapper verified with `./mvnw -version`
- [ ] Docker verified
- [ ] Docker Compose verified
- [ ] `.env` created from `.env.example`
- [ ] Local database password configured
- [ ] Local JWT secret configured
- [ ] MySQL started with `docker compose up -d`
- [ ] MySQL reports `healthy`
- [ ] Eight ShopSphere databases verified
- [ ] Git hook path verified as `scripts/git-hooks`
- [ ] Complete Maven build succeeds
- [ ] Developer can create a feature branch from `develop`
- [ ] Developer understands that `main` and `develop` are never pushed
      to directly
- [ ] Developer understands the Pull Request workflow
- [ ] Developer understands service ownership and cross-service
      boundary rules

Once these checks pass, the developer can begin work on a feature
branch.
