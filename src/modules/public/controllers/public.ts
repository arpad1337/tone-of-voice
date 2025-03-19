import {
  Controller,
  ControllerError,
  DatabaseProvider,
  ErrorLike,
  RequestWithId,
  ResponseFormatter,
  SingletonClassType,
} from "@greeneyesai/api-utils";
import { Response, NextFunction } from "express";
import * as yup from "yup";
import { OpenAIAdapter } from "../adapters/openai";
import {
  ToneOfVoiceModelType,
  ToneOfVoiceModelTypeStatic,
} from "../../../lib/models/tone-of-voice";

export interface ISymbolResponseBody {
  currentPrice: number;
  movingAverage: number;
  lastCheckedAt: string;
}

export class PublicController extends Controller {
  public static get Dependencies(): [
    SingletonClassType<DatabaseProvider>,
    SingletonClassType<OpenAIAdapter>
  ] {
    return [DatabaseProvider, OpenAIAdapter];
  }

  public constructor(
    protected _databaseProvider: DatabaseProvider,
    protected _openaiAdapter: OpenAIAdapter
  ) {
    super();
  }

  // [GET] /api/v1/:provider
  public async getProviderToneOfVoice(
    req: RequestWithId,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationSchema: yup.Schema = yup.object({
        provider: yup
          .string()
          .min(1, "Provider must be at least 1 character")
          .max(30, "Provider must be maximum 30 character")
          .required("Provider missing"),
      });

      await validationSchema.validate(req.params, { strict: true });

      const provider: string = req.params.provider!;

      try {
        const { response } = await this._openaiAdapter.wrappedAPICall(
          req.token!,
          "getToneOfVoiceForProvider",
          provider,
          provider
        )();

        const ToneOfVoice: ToneOfVoiceModelTypeStatic =
          this._databaseProvider.getModelByName("tone-of-voice")!;

        const item: ToneOfVoiceModelType =
          await ToneOfVoice.createWithProviderAndResponse(provider, response);

        res
          .status(200)
          .json(new ResponseFormatter(item.getPublicView()).toResponse());
      } catch (e) {
        this.logger?.error(
          ErrorLike.createFromError(e as Error).setToken(req.token)
        );
        const err = new ControllerError(`Provider ${provider} is not found`);
        res.status(404).json(new ResponseFormatter(err).toErrorResponse());
        return;
      }
    } catch (e) {
      const err = (
        e instanceof ControllerError
          ? e
          : ControllerError.createFromError(e as Error)
      )
        .clone()
        .setToken(req.token);
      return next(err);
    }
  }

  // [POST] /api/v1/:provider/message
  public async getProviderSpecificMessage(
    req: RequestWithId,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validationSchema: yup.Schema = yup.object({
        provider: yup
          .string()
          .min(1, "Provider must be at least 1 character")
          .max(30, "Provider must be maximum 30 character")
          .required("Provider missing"),
      });

      await validationSchema.validate(req.params, { strict: true });

      const provider: string = req.params.provider!;

      const ToneOfVoice: ToneOfVoiceModelTypeStatic =
        this._databaseProvider.getModelByName("tone-of-voice")!;

      const item: ToneOfVoiceModelType | null = await ToneOfVoice.findOne({
        where: {
          provider,
        },
      });

      if (!item) {
        throw new ControllerError(`Missing tone for ${provider}`);
      }

      const tone: string = item.get("response") as string;

      const validationSchema2: yup.Schema = yup.object({
        message: yup.string().required("Message missing"),
      });

      await validationSchema2.validate(req.body, { strict: true });

      const message: string = req.body.message;

      try {
        const { response } = await this._openaiAdapter.wrappedAPICall(
          req.token!,
          "getMessageByToneAndContents",
          provider,
          tone,
          message
        )();

        res
          .status(200)
          .json(new ResponseFormatter(response).toResponse());
      } catch (e) {
        this.logger?.error(
          ErrorLike.createFromError(e as Error).setToken(req.token)
        );
        const err = new ControllerError(`Provider ${provider} is not found`);
        res.status(404).json(new ResponseFormatter(err).toErrorResponse());
        return;
      }
    } catch (e) {
      const err = (
        e instanceof ControllerError
          ? e
          : ControllerError.createFromError(e as Error)
      )
        .clone()
        .setToken(req.token);
      return next(err);
    }
  }

  // [GET] /api/v1/list
  public async getResponses(
    req: RequestWithId,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const ToneOfVoice: ToneOfVoiceModelTypeStatic =
        this._databaseProvider.getModelByName("tone-of-voice")!;

      const items: ToneOfVoiceModelType[] = await ToneOfVoice.findAll({
        order: [["objectId", "DESC"]],
      });

      res
        .status(200)
        .json(
          new ResponseFormatter(
            items.map((i) => i.getPublicView())
          ).toResponse()
        );
    } catch (e) {
      const err = (
        e instanceof ControllerError
          ? e
          : ControllerError.createFromError(e as Error)
      )
        .clone()
        .setToken(req.token);
      return next(err);
    }
  }
}
