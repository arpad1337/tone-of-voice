import {
  IRoute,
  IRouteFactory,
  ILoggerInstance,
  ProviderDefinitionType,
  CacheProvider,
  ICacheConfig,
  LoggerAccessor,
  ApplicationEvents,
  NativeMiddleware,
  Cryptography,
  ICryptographyConfig,
  LogLevel,
  DatabaseProvider,
  IDatabaseConfig,
} from "@greeneyesai/api-utils";
import BodyParserMiddleware from "body-parser";
import { ToneOfVoiceAPIApplication } from "./lib/tone-of-voice-api";
import { CommonModule, PublicModule } from "./modules";
import { Config } from "./lib/config";
import { DatabaseSynchronizer, IDatabaseSynchronizerConfig } from "./lib/providers/database-synchronizer";

const logger: ILoggerInstance =
  Config.ApplicationConfig.ENV === "development"
    ? LoggerAccessor.setLogLevel(LogLevel.DEBUG).consoleLogger
    : LoggerAccessor.logger;

export function createApp(): ToneOfVoiceAPIApplication {
  try {
    const routeFactory: IRouteFactory = {
      create(): IRoute[] {
        const commonRoutes = CommonModule.createRoutes();
        const publicRoutes = PublicModule.createRoutes();
        logger.info(`Routes created successfully.`);
        return [...commonRoutes, ...publicRoutes];
      },
    };

    const databaseProviderDefinition: ProviderDefinitionType<
      DatabaseProvider,
      IDatabaseConfig
    > = {
      class: DatabaseProvider,
      config: Config.DatabaseConfig,
    };

    const databaseSynchronizerDefinition: ProviderDefinitionType<
      DatabaseSynchronizer,
      IDatabaseSynchronizerConfig
    > = {
      class: DatabaseSynchronizer,
      config: ["tone-of-voice"],
    };

    const cacheProviderDefinition: ProviderDefinitionType<
      CacheProvider,
      ICacheConfig
    > = {
      class: CacheProvider,
      config: Config.CacheConfig,
    };

    const cryptographyDefinition: ProviderDefinitionType<
      Cryptography,
      ICryptographyConfig
    > = {
      class: Cryptography,
      config: Config.EncryptionConfig,
    };

    const providers: ProviderDefinitionType<any, any>[] = [
      databaseProviderDefinition,
      databaseSynchronizerDefinition,
      cacheProviderDefinition,
      cryptographyDefinition,
    ];

    const bodyParserMiddleware: NativeMiddleware = BodyParserMiddleware.json({
      limit: "1mb",
    });

    logger.info(
      `[START] Running release version "${Config.ApplicationConfig.commitSHA}"`,
      {
        token: ToneOfVoiceAPIApplication.ApplicationName,
      }
    );

    const app: ToneOfVoiceAPIApplication =
      new ToneOfVoiceAPIApplication(Config.ApplicationConfig.port)
        .attachToContext(process)
        .setLoggerInterface(logger)
        .addNativeMiddleware(bodyParserMiddleware);

    if (!process.env.CI) {
      app.configureProviders(providers);
    } else {
      cryptographyDefinition.class.instance.configure(Config.EncryptionConfig);
    }

    app
      .mountRoutes(routeFactory)
      .once(
        ApplicationEvents.Closing,
        (_app: ToneOfVoiceAPIApplication) => {
          logger.info(
            `[END] Terminating release version "${Config.ApplicationConfig.commitSHA}"`,
            {
              token: ToneOfVoiceAPIApplication.ApplicationName,
            }
          );
        }
      );
    return app;
  } catch (e) {
    throw e;
  }
}

export async function main() {
  try {
    const app = createApp();
    await app.listen();
  } catch (e) {
    logger.error(e, () => process.exit(1));
  }
}
