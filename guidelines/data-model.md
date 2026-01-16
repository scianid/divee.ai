
# Data Model: User, Account, Project, Article

## Overview
This data model reflects the current SQL schema, including users, accounts, projects, and articles, with their relationships and key attributes.

---

## Entities & Relationships

### 1. User
- Managed by Supabase Auth (`auth.users`)
- **A user can have multiple accounts.**

### 2. Account
- **Each account belongs to a user.**
- Attributes:
  - `id`: UUID, primary key
  - `user_id`: UUID, references `auth.users(id)`
  - `name`: Account name
  - `created_at`: Timestamp

### 3. Project
- **Each project belongs to an account.**
- Attributes:
  - `id`: bigint, primary key
  - `created_at`: Timestamp
  - `direction`: Enum (USER-DEFINED)
  - `language`: Text
  - `icon_url`: Text (nullable)
  - `client_name`: Text
  - `client_description`: Text (nullable)
  - `highlight_color`: Array (nullable)
  - `show_ad`: Boolean
  - `input_text_placeholders`: Array
  - `project_id`: Text, unique, default UUID
  - `allowed_urls`: Array (nullable)
  - `user_id`: UUID (legacy, may be deprecated)
  - `account_id`: UUID, references `account(id)`

### 4. Article
- **Each article is linked to a project.**
- Attributes:
  - `url`: Text, unique
  - `title`: Text
  - `content`: Text (nullable)
  - `cache`: JSONB (nullable)
  - `project_id`: Text, unique, references a project

---

## Entity Relationship Diagram (ERD)

```
auth.users
   |
   |--< account
            |
            |--< project
                      |
                      |--< article
```

- `auth.users` 1 --- * `account`
- `account` 1 --- * `project`
- `project` 1 --- * `article`

---

## Example

- User: Alice
  - Account 1: "Personal"
    - Project A: "Widget Alpha"
      - Article 1: "How to Use Alpha"
    - Project B: "Widget Beta"
  - Account 2: "Work"
    - Project C: "Widget Gamma"

---

## Notes
- The `user_id` in `project` is retained for legacy support but new logic should use `account_id`.
- Foreign keys:
  - `account.user_id` → `auth.users.id`
  - `project.account_id` → `account.id`
  - `article.project_id` → `project.project_id`
- This model supports future expansion (e.g., shared accounts, project collaborators).
