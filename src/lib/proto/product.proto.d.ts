import * as $protobuf from "protobufjs";
import Long = require("long");
export namespace proto_database {

    enum LanguageOption {
        LANGOPTION_NONE = 0,
        LANGOPTION_TEXT = 1,
        LANGOPTION_SPEECH = 2,
        LANGOPTION_TEXT_AND_SPEECH = 3
    }

    enum LanguageSettingType {
        LANGSETTING_NONE = 0,
        LANGSETTING_SINGLE = 1,
        LANGSETTING_SIMPLE = 2,
        LANGSETTING_ADVANCED = 3
    }

    enum ShortcutOption {
        SHORTCUT_NONE = 0,
        SHORTCUT_USER = 1,
        SHORTCUT_ALL_USERS = 2
    }

    enum Operation {
        OP_NONE = -1,
        OP_UPDATE = 0,
        OP_BACKFILL = 1,
        OP_REPAIR = 2,
        OP_UNINSTALL = 3
    }

    interface ILanguageSetting {
        language?: (string|null);
        option?: (proto_database.LanguageOption|null);
    }

    class LanguageSetting implements ILanguageSetting {
        constructor(properties?: proto_database.ILanguageSetting);
        public language: string;
        public option: proto_database.LanguageOption;
        public static create(properties?: proto_database.ILanguageSetting): proto_database.LanguageSetting;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.LanguageSetting;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.LanguageSetting;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.LanguageSetting;
        public static toObject(message: proto_database.LanguageSetting, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IUserSettings {
        installPath?: (string|null);
        playRegion?: (string|null);
        desktopShortcut?: (proto_database.ShortcutOption|null);
        startmenuShortcut?: (proto_database.ShortcutOption|null);
        languageSettings?: (proto_database.LanguageSettingType|null);
        selectedTextLanguage?: (string|null);
        selectedSpeechLanguage?: (string|null);
        languages?: (proto_database.ILanguageSetting[]|null);
        additionalTags?: (string|null);
        versionBranch?: (string|null);
        accountCountry?: (string|null);
        geoIpCountry?: (string|null);
        gameSubfolder?: (string|null);
    }

    class UserSettings implements IUserSettings {
        constructor(properties?: proto_database.IUserSettings);
        public installPath: string;
        public playRegion: string;
        public desktopShortcut: proto_database.ShortcutOption;
        public startmenuShortcut: proto_database.ShortcutOption;
        public languageSettings: proto_database.LanguageSettingType;
        public selectedTextLanguage: string;
        public selectedSpeechLanguage: string;
        public languages: proto_database.ILanguageSetting[];
        public additionalTags: string;
        public versionBranch: string;
        public accountCountry: string;
        public geoIpCountry: string;
        public gameSubfolder: string;
        public static create(properties?: proto_database.IUserSettings): proto_database.UserSettings;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.UserSettings;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.UserSettings;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.UserSettings;
        public static toObject(message: proto_database.UserSettings, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IInstallHandshake {
        product?: (string|null);
        uid?: (string|null);
        settings?: (proto_database.IUserSettings|null);
    }

    class InstallHandshake implements IInstallHandshake {
        constructor(properties?: proto_database.IInstallHandshake);
        public product: string;
        public uid: string;
        public settings?: (proto_database.IUserSettings|null);
        public static create(properties?: proto_database.IInstallHandshake): proto_database.InstallHandshake;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.InstallHandshake;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.InstallHandshake;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.InstallHandshake;
        public static toObject(message: proto_database.InstallHandshake, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IBuildConfig {
        region?: (string|null);
        buildConfig?: (string|null);
    }

    class BuildConfig implements IBuildConfig {
        constructor(properties?: proto_database.IBuildConfig);
        public region: string;
        public buildConfig: string;
        public static create(properties?: proto_database.IBuildConfig): proto_database.BuildConfig;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.BuildConfig;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.BuildConfig;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.BuildConfig;
        public static toObject(message: proto_database.BuildConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IBaseProductState {
        installed?: (boolean|null);
        playable?: (boolean|null);
        updateComplete?: (boolean|null);
        backgroundDownloadAvailable?: (boolean|null);
        backgroundDownloadComplete?: (boolean|null);
        currentVersion?: (string|null);
        currentVersionStr?: (string|null);
        installedBuildConfig?: (proto_database.IBuildConfig[]|null);
        backgroundDownloadBuildConfig?: (proto_database.IBuildConfig[]|null);
        decryptionKey?: (string|null);
        completedInstallActions?: (string[]|null);
        completedBuildKeys?: (string[]|null);
        completedBgdlKeys?: (string[]|null);
        activeBuildKey?: (string|null);
        activeBgdlKey?: (string|null);
        activeInstallKey?: (string|null);
        activeTagString?: (string|null);
    }

    class BaseProductState implements IBaseProductState {
        constructor(properties?: proto_database.IBaseProductState);
        public installed: boolean;
        public playable: boolean;
        public updateComplete: boolean;
        public backgroundDownloadAvailable: boolean;
        public backgroundDownloadComplete: boolean;
        public currentVersion: string;
        public currentVersionStr: string;
        public installedBuildConfig: proto_database.IBuildConfig[];
        public backgroundDownloadBuildConfig: proto_database.IBuildConfig[];
        public decryptionKey: string;
        public completedInstallActions: string[];
        public completedBuildKeys: string[];
        public completedBgdlKeys: string[];
        public activeBuildKey: string;
        public activeBgdlKey: string;
        public activeInstallKey: string;
        public activeTagString: string;
        public static create(properties?: proto_database.IBaseProductState): proto_database.BaseProductState;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.BaseProductState;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.BaseProductState;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.BaseProductState;
        public static toObject(message: proto_database.BaseProductState, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IBackfillProgress {
        progress?: (number|null);
        backgrounddownload?: (boolean|null);
        paused?: (boolean|null);
        downloadLimit?: (number|Long|null);
    }

    class BackfillProgress implements IBackfillProgress {
        constructor(properties?: proto_database.IBackfillProgress);
        public progress: number;
        public backgrounddownload: boolean;
        public paused: boolean;
        public downloadLimit: (number|Long);
        public static create(properties?: proto_database.IBackfillProgress): proto_database.BackfillProgress;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.BackfillProgress;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.BackfillProgress;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.BackfillProgress;
        public static toObject(message: proto_database.BackfillProgress, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IRepairProgress {
        progress?: (number|null);
    }

    class RepairProgress implements IRepairProgress {
        constructor(properties?: proto_database.IRepairProgress);
        public progress: number;
        public static create(properties?: proto_database.IRepairProgress): proto_database.RepairProgress;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.RepairProgress;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.RepairProgress;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.RepairProgress;
        public static toObject(message: proto_database.RepairProgress, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IUpdateProgress {
        lastDiscSetUsed?: (string|null);
        progress?: (number|null);
        discIgnored?: (boolean|null);
        totalToDownload?: (number|Long|null);
        downloadRemaining?: (number|Long|null);
    }

    class UpdateProgress implements IUpdateProgress {
        constructor(properties?: proto_database.IUpdateProgress);
        public lastDiscSetUsed: string;
        public progress: number;
        public discIgnored: boolean;
        public totalToDownload: (number|Long);
        public downloadRemaining: (number|Long);
        public static create(properties?: proto_database.IUpdateProgress): proto_database.UpdateProgress;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.UpdateProgress;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.UpdateProgress;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.UpdateProgress;
        public static toObject(message: proto_database.UpdateProgress, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface ICachedProductState {
        baseProductState?: (proto_database.IBaseProductState|null);
        backfillProgress?: (proto_database.IBackfillProgress|null);
        repairProgress?: (proto_database.IRepairProgress|null);
        updateProgress?: (proto_database.IUpdateProgress|null);
    }

    class CachedProductState implements ICachedProductState {
        constructor(properties?: proto_database.ICachedProductState);
        public baseProductState?: (proto_database.IBaseProductState|null);
        public backfillProgress?: (proto_database.IBackfillProgress|null);
        public repairProgress?: (proto_database.IRepairProgress|null);
        public updateProgress?: (proto_database.IUpdateProgress|null);
        public static create(properties?: proto_database.ICachedProductState): proto_database.CachedProductState;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.CachedProductState;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.CachedProductState;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.CachedProductState;
        public static toObject(message: proto_database.CachedProductState, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IProductOperations {
        activeOperation?: (proto_database.Operation|null);
        priority?: (number|Long|null);
    }

    class ProductOperations implements IProductOperations {
        constructor(properties?: proto_database.IProductOperations);
        public activeOperation: proto_database.Operation;
        public priority: (number|Long);
        public static create(properties?: proto_database.IProductOperations): proto_database.ProductOperations;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.ProductOperations;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.ProductOperations;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.ProductOperations;
        public static toObject(message: proto_database.ProductOperations, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IProductInstall {
        uid?: (string|null);
        productCode?: (string|null);
        settings?: (proto_database.IUserSettings|null);
        cachedProductState?: (proto_database.ICachedProductState|null);
        productOperations?: (proto_database.IProductOperations|null);
        productFamily?: (string|null);
        hidden?: (boolean|null);
    }

    class ProductInstall implements IProductInstall {
        constructor(properties?: proto_database.IProductInstall);
        public uid: string;
        public productCode: string;
        public settings?: (proto_database.IUserSettings|null);
        public cachedProductState?: (proto_database.ICachedProductState|null);
        public productOperations?: (proto_database.IProductOperations|null);
        public productFamily: string;
        public hidden: boolean;
        public static create(properties?: proto_database.IProductInstall): proto_database.ProductInstall;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.ProductInstall;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.ProductInstall;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.ProductInstall;
        public static toObject(message: proto_database.ProductInstall, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IProductConfig {
        productCode?: (string|null);
        metadataHash?: (string|null);
    }

    class ProductConfig implements IProductConfig {
        constructor(properties?: proto_database.IProductConfig);
        public productCode: string;
        public metadataHash: string;
        public static create(properties?: proto_database.IProductConfig): proto_database.ProductConfig;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.ProductConfig;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.ProductConfig;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.ProductConfig;
        public static toObject(message: proto_database.ProductConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IActiveProcess {
        processName?: (string|null);
        pid?: (number|null);
        uri?: (string[]|null);
    }

    class ActiveProcess implements IActiveProcess {
        constructor(properties?: proto_database.IActiveProcess);
        public processName: string;
        public pid: number;
        public uri: string[];
        public static create(properties?: proto_database.IActiveProcess): proto_database.ActiveProcess;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.ActiveProcess;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.ActiveProcess;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.ActiveProcess;
        public static toObject(message: proto_database.ActiveProcess, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IDownloadSettings {
        downloadLimit?: (number|Long|null);
        backfillLimit?: (number|Long|null);
    }

    class DownloadSettings implements IDownloadSettings {
        constructor(properties?: proto_database.IDownloadSettings);
        public downloadLimit: (number|Long);
        public backfillLimit: (number|Long);
        public static create(properties?: proto_database.IDownloadSettings): proto_database.DownloadSettings;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.DownloadSettings;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.DownloadSettings;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.DownloadSettings;
        public static toObject(message: proto_database.DownloadSettings, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    interface IDatabase {
        productInstall?: (proto_database.IProductInstall[]|null);
        activeInstalls?: (proto_database.IInstallHandshake[]|null);
        activeProcesses?: (proto_database.IActiveProcess[]|null);
        productConfigs?: (proto_database.IProductConfig[]|null);
        downloadSettings?: (proto_database.IDownloadSettings|null);
        versionSummarySeqn?: (number|Long|null);
        priorityUidList?: (string[]|null);
    }

    class Database implements IDatabase {
        constructor(properties?: proto_database.IDatabase);
        public productInstall: proto_database.IProductInstall[];
        public activeInstalls: proto_database.IInstallHandshake[];
        public activeProcesses: proto_database.IActiveProcess[];
        public productConfigs: proto_database.IProductConfig[];
        public downloadSettings?: (proto_database.IDownloadSettings|null);
        public versionSummarySeqn: (number|Long);
        public priorityUidList: string[];
        public static create(properties?: proto_database.IDatabase): proto_database.Database;
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto_database.Database;
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto_database.Database;
        public static verify(message: { [k: string]: any }): (string|null);
        public static fromObject(object: { [k: string]: any }): proto_database.Database;
        public static toObject(message: proto_database.Database, options?: $protobuf.IConversionOptions): { [k: string]: any };
        public toJSON(): { [k: string]: any };
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}
