# vakman-crm

Laravel CRM application with Inertia.js and React.

## Database setup

### PostgreSQL (Docker)

1. **Start PostgreSQL:**

    ```bash
    docker compose up -d pgsql
    ```

2. **Configure Laravel** in `.env`

    ```env
    DB_CONNECTION=pgsql
    DB_HOST=127.0.0.1
    DB_PORT=5433
    DB_DATABASE=your_database
    DB_USERNAME=your_username
    DB_PASSWORD=your_password
    ```

    Docker uses port **5433** by default so it doesn't conflict with a local Postgres on 5432. Run `docker compose` from the project root so it picks up `.env`.

3. **Run migrations:**

    ```bash
    php artisan migrate
    ```

To manage PostgreSQL locally, use [pgAdmin](https://www.pgadmin.org/), [TablePlus](https://tableplus.com/), or [DBeaver](https://dbeaver.io/) and connect to **127.0.0.1:5433** using the same `DB_*` values from your `.env`.

**If you see "role does not exist":** You're likely hitting a different Postgres (e.g. local on 5432). Use `DB_PORT=5433` so Laravel talks to the Docker container. Then `docker compose down -v` and `docker compose up -d pgsql` for a fresh volume.

---
