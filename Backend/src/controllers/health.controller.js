import { Pool } from "pg"

export const healthCheck = async (req, res) => {

    const pool = new Pool({
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'yourpassword',
        database: process.env.PG_DATABASE || 'yourdb',
    });

    const checks = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: "unknown",
        externalApi: "unknown",
    }

    // postgres Sql check

    try {
        const result = await pool.query("SELECT 1")
        checks.database = result.rowCount === 1 ? "ok" : "error"
    } catch (error) {
        checks.database = "error"
    }


    // external API example check

    try {
        const response = await fetch("https://api.github.com")
        checks.externalApi = response.ok ? "ok" : "error"
    } catch (error) {
        checks.externalApi = "error"
    }

    const isHealthy = Object.values(checks).every(
        (val) => val === "ok" || typeof val === "number" || typeof val === "string"
    )

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "ok" : "error",
        ...checks
    })
}