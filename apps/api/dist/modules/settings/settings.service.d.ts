export declare class SettingsService {
    getByCategory(category: string): Record<string, unknown>;
    update(key: string, value: unknown): {
        key: string;
        value: unknown;
        updated: boolean;
    };
}
