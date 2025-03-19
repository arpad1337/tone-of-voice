import { BIGINT, REAL, STRING, TEXT } from "sequelize";
import {
  DatabaseModelError,
  IParanoidAttributes,
  ITimestampsAttributes,
  Model,
  ModelStatic,
  ISchema,
  ModelTraitStatic,
  DatabaseProvider,
  ModelDefinition,
  DatabaseModelHelper,
  ModelTrait,
} from "@greeneyesai/api-utils";
import crypto from "crypto";

export class ToneOfVoiceModelError extends DatabaseModelError<ToneOfVoiceModelTypeStatic> {}

export const TABLE_NAME = "tone_of_voice";

export const TABLE_FIELDS = {
  objectId: {
    field: "object_id",
    type: BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  id: {
    type: STRING(36),
    allowNull: false,
  },
  provider: {
    type: STRING(30),
    allowNull: false,
  },
  response: {
    type: TEXT,
  },
};

export interface IToneOfVoice
  extends ISchema,
    IParanoidAttributes,
    ITimestampsAttributes {
  objectId?: number;
  id: number;
  provider: string;
  response: string;
}

export type StaticHelpersTraitType = ModelTraitStatic<
  IToneOfVoice,
  {
    createWithProviderAndResponse(
      this: ToneOfVoiceModelTypeStatic,
      provider: string,
      response: string
    ): Promise<ToneOfVoiceModelType>;
  }
>;

export type ToneOfVoiceModelType = Model<IToneOfVoice> & ViewsTraitType;

export type ToneOfVoiceModelTypeStatic = ModelStatic<ToneOfVoiceModelType> &
  StaticHelpersTraitType;

export const StaticHelpersTrait: StaticHelpersTraitType = {
  createWithProviderAndResponse: async function (
    provider: string,
    response: string
  ): Promise<ToneOfVoiceModelType> {
    return this.create({
      id: crypto.randomUUID(),
      provider,
      response,
    });
  },
};

export interface IToneOfVoicePublicView
  extends Omit<IToneOfVoice, "objectId"> {}

export type ViewsTraitType = ModelTrait<
  IToneOfVoice,
  {
    getPublicView(): IToneOfVoicePublicView;
  }
>;

export const ViewsTrait: ViewsTraitType = {
  getPublicView: function (): IToneOfVoicePublicView {
    const json = DatabaseModelHelper.PATCHED_GETTER(this);
    delete json.objectId;
    delete json.deletedAt;
    return json;
  },
};

export function factory(
  databaseProvider: DatabaseProvider
): ToneOfVoiceModelTypeStatic {
  const model: ModelDefinition = DatabaseModelHelper.buildModel(
    // Table name
    TABLE_NAME,
    // Schema
    TABLE_FIELDS,
    // Traits
    [
      DatabaseModelHelper.PARANOID_MODEL_SETTINGS, // deletedAt
      DatabaseModelHelper.TIMESTAMPS_SETTINGS, // createdAt / updatedAt
    ]
  );

  const ToneOfVoiceModel: ModelStatic<Model<IToneOfVoice>> =
    databaseProvider.connection!.define(
      "ToneOfVoice",
      model.schema,
      model.settings
    );

  DatabaseModelHelper.attachTraitToModel(ToneOfVoiceModel, ViewsTrait);

  DatabaseModelHelper.attachTraitToModelStatic(
    ToneOfVoiceModel,
    StaticHelpersTrait
  );

  return ToneOfVoiceModel as ToneOfVoiceModelTypeStatic;
}
