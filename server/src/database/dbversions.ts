import type { Migrations } from '../types/migrations.js'

export class Database {
    static migrations: Migrations[] = [
        {
            version: 1,
            description: 'Full database installation',
            file: '1_full.sql'
        }
    ]
}