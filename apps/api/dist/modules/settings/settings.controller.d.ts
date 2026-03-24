import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getByCategory(category: string): Record<string, unknown>;
    update(key: string, body: {
        value: unknown;
    }): {
        key: string;
        value: unknown;
        updated: boolean;
    };
}
