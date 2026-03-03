import { closeDb } from 'gtfs';
import { loadDb } from './db-utils.js';
import { getConfig } from './file-utils.js';
import type { Config } from '../types/global.js';

type DbConnection = Awaited<ReturnType<typeof loadDb>>;

interface ServerContext {
    config: Config;
    db: DbConnection;
}

let serverContextPromise: Promise<ServerContext> | null = null;
let shutdownRegistered = false;

function registerShutdownHandlers(db: DbConnection) {
    if (shutdownRegistered) {
        return;
    }

    let isClosed = false;
    const shutdown = () => {
        if (isClosed) {
            return;
        }

        isClosed = true;
        closeDb(db);
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
    process.once('exit', shutdown);
    shutdownRegistered = true;
}

export function getServerContext(): Promise<ServerContext> {
    if (!serverContextPromise) {
        serverContextPromise = (async () => {
            const config = await getConfig();
            const db = await loadDb(config);

            registerShutdownHandlers(db);

            return {
                config,
                db,
            };
        })().catch((error) => {
            serverContextPromise = null;
            throw error;
        });
    }

    return serverContextPromise;
}
