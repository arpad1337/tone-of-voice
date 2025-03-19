import {
  Application,
  ApplicationEvents,
  ExecutionContext,
  ILoggerInstance,
  ProviderDefinitionType,
  IRouteFactory,
  StoreProvider,
  StoreProviderEvents,
} from "@greeneyesai/api-utils";
import { once } from "events";
import express from "express";
import path from "path";

export class ToneOfVoiceAPIApplication extends Application {
  public static get ApplicationName() {
    return "ToneOfVoiceAPI";
  }

  public ApplicationName() {
    return ToneOfVoiceAPIApplication.ApplicationName;
  }

  public allowCors(): this {
    this.app.disable('trust proxy');
    return super.allowCors();
  }

  public setLoggerInterface(loggerInstance: ILoggerInstance): this {
    return super
      .setLoggerInterface(loggerInstance)
      .bindHandlerToContextEvents(
        ["uncaughtException", "unhandledRejection"],
        (
          _app: ToneOfVoiceAPIApplication,
          _context: ExecutionContext,
          err: Error
        ) => {
          _app.logger?.error(err, {
            token: ToneOfVoiceAPIApplication.ApplicationName,
          });
        }
      )
      .once(ApplicationEvents.Closed, (_app: ToneOfVoiceAPIApplication) => {
        _app.getLoggerInterface()?.info(`Application closed.`, {
          token: ToneOfVoiceAPIApplication.ApplicationName,
        });
        _app.logger?.onExit && _app.logger?.onExit();
        !!_app.getContext() &&
          _app.getContext()!.exit &&
          _app.getContext()!.exit!();
      })
      .bindHandlerToContextEvents(
        ["SIGTERM", "SIGUSR2"],
        (_app: ToneOfVoiceAPIApplication) => {
          _app.logger?.debug(`Received SIGTERM...`, {
            token: ToneOfVoiceAPIApplication.ApplicationName,
          });
          _app.notify("sigtermFromOS").close();
        }
      )
      .disableApplicationSignature()
      .allowCors();
  }

  public mountRoutes(factory: IRouteFactory): this {
    this.app.use("/", express.static(path.join(__dirname, "../../static")));
    return super
      .mountRoutes(factory)
      .addRouteNotFoundHandler()
      .addDefaultErrorHandler([
        "SequelizeDatabaseError",
        "DataCloneError",
        "connect ECONNREFUSED" /* Axios */,
        "StoreProviderError",
      ])
      .once(ApplicationEvents.Listening, (_app: ToneOfVoiceAPIApplication) => {
        _app.logger?.info(`Application launched on port ${_app.getPort()}.`, {
          token: ToneOfVoiceAPIApplication.ApplicationName,
        });
      });
  }

  public configureProviders(
    providers: ProviderDefinitionType<any, any>[]
  ): this {
    super.configureProviders(providers);
    (async (
      _app: ToneOfVoiceAPIApplication,
      _providers: ProviderDefinitionType<any, any>[]
    ) => {
      await Promise.all(
        _providers
          .filter(
            (providerDefinition: ProviderDefinitionType<any, any>): boolean =>
              providerDefinition.class.instance instanceof StoreProvider
          )
          .map(
            (
              providerDefinition: ProviderDefinitionType<
                StoreProvider<any>,
                any
              >
            ): Promise<void> =>
              once(
                providerDefinition.class.instance,
                StoreProviderEvents.Connected
              ) as unknown as Promise<void>
          )
      );
      _app.logger?.info(`Store providers connected.`, {
        token: ToneOfVoiceAPIApplication.ApplicationName,
      });
    })(this, providers);
    return this;
  }
}
