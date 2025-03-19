import {
  CacheProviderWithProxiedClientType,
  Cryptography,
  ErrorLike,
} from "@greeneyesai/api-utils";
import { AdapterError, BaseAdapter } from "../../../lib/adapters/base-adapter";
import OpenAI from "openai";
import axios from "axios";

export class OpenAIAdapter extends BaseAdapter {
  public static create(
    cacheProvider: CacheProviderWithProxiedClientType,
    cryptography: Cryptography
  ): OpenAIAdapter {
    const openaiClient: OpenAI = new OpenAI();
    const instance: OpenAIAdapter = new this(
      cacheProvider,
      cryptography,
      openaiClient
    );
    return instance;
  }

  public constructor(
    protected _cacheProvider: CacheProviderWithProxiedClientType,
    protected _cryptography: Cryptography,
    protected _openaiClient: OpenAI
  ) {
    super(_cacheProvider, _cryptography, axios.create());
  }

  protected getPromptForProvider(provider: string): string {
    return `
      Identify and define the five most important characteristics of a tone of voice for ${provider}, such as tone, language style, level of formality, forms of address, and emotional appeal. 
    `;
  }

  protected getPromptForToneAndMessage(tone: string, message: string): string {
    return `
      Use this tone "${tone}" to rephrase this message: ${message}
    `;
  }

  public async getToneOfVoiceForProvider(
    correlationId: string,
    provider: string
  ): Promise<{ response: string }> {
    try {
      const completion = await this._openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: this.getPromptForProvider(provider),
          },
        ],
      });

      if (!completion) {
        throw new AdapterError(`Response for ${provider} havent been captured`);
      }

      return {
        response: completion.choices[0].message.content as string,
      };
    } catch (e) {
      const err = ErrorLike.createFromError(e as Error);
      err.setMetadata({ provider });
      throw err;
    }
  }

  public async getMessageByToneAndContents(
    correlationId: string,
    tone: string,
    message: string,
  ): Promise<{ response: string }> {
    try {
      const completion = await this._openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: this.getPromptForToneAndMessage(tone, message),
          },
        ],
      });

      if (!completion) {
        throw new AdapterError(`Response for "${message}" havent been captured`);
      }

      return {
        response: completion.choices[0].message.content as string,
      };
    } catch (e) {
      const err = ErrorLike.createFromError(e as Error);
      err.setMetadata({ message });
      throw err;
    }
  }
}
