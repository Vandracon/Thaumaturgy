import { Message } from "../Data/OpenAIProtocol/LLMChatCompletionRequestBody";
import * as config from "config";
import * as fs from "fs";
import path from "path";
import * as ini from "ini";
import { LLMConfig } from "../Data/MemGPT/Mod/LLMConfig";
import { HttpException } from "../../Server/middleware/ErrorHandlingMiddleware";
import { HttpStatusCode } from "axios";
import { Response } from "express";

/*
To update all agent core memory limits
UPDATE your_table_name
SET your_column_name = json_set(
    your_column_name,
    '$.memory.persona.limit', 4000,
    '$.memory.human.limit', 4000
)
*/

export class Utility {
  public static LastImportStatusUpdate = "";

  public static generateChatChunkId() {
    const prefix = "chatcmpl-";
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 20; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return prefix + result;
  }

  public static randomAcknowledgement() {
    const acknowledgements = [
      // "Right, I have no more to say at the moment.",
      // "Okay, that's all I can say at the moment.",
      // "Uh-huh, I understand what you're saying.",
      // "I understand, I have nothing yet to say.",
      // "Interesting, but I have no reply yet.",
      "I have no response at the moment.",
    ];

    const randomIndex = Math.floor(Math.random() * acknowledgements.length);
    return acknowledgements[randomIndex];
  }

  public static buildMessageChunk(
    id: string,
    createdInSeconds: number,
    model: string,
    delta: Message | Object,
    finishReason: string | null,
  ) {
    return {
      id: id,
      object: "chat.completion.chunk",
      created: createdInSeconds,
      model: model,
      choices: [
        {
          index: 0,
          delta: delta,
          finish_reason: finishReason,
        },
      ],
    };
  }

  public static getMockMemGPTResponse() {
    return {
      messages: [],
      usage: {
        completion_tokens: 0,
        prompt_tokens: 0,
        total_tokens: 0,
        step_count: 0,
      },
    };
  }

  public static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    values.sort((a, b) => a - b);

    const half = Math.floor(values.length / 2);

    if (values.length % 2) return values[half];

    return (values[half - 1] + values[half]) / 2.0;
  }

  public static calculateMAD(values: number[], median: number): number {
    const deviations = values.map((value) => Math.abs(value - median));
    return this.calculateMedian(deviations);
  }

  public static calculateMADWithScaleAndMax(
    medianResponseTime: number,
    mad: number,
  ) {
    return (
      medianResponseTime +
      config.MEMGPT.DYNAMIC_RESPONSE_TIME_SCALE * mad +
      config.MEMGPT.ADDITIONAL_DYNAMIC_RESPONSE_TIMEOUT_IN_MS
    );
  }

  public static convertStringNameFormatToArrayOfNames(str: string): string[] {
    // Edge case: if the string is empty, return an empty array
    if (str === "") {
      return [];
    }

    // Split the string by the ' and ' delimiter first
    let parts = str.split(" and ");

    // If there are more than two parts, handle it correctly
    if (parts.length > 2) {
      const lastPart = parts.pop()!;
      const joinedPart = parts.join(" and ");
      parts = [joinedPart, lastPart];
    }

    // If there's only one part after splitting, return the single element array
    if (parts.length === 1) {
      return parts;
    }

    // If there are exactly two parts, further split the first part by comma and trim whitespace
    let firstParts = parts[0].split(", ").map((part) => part.trim());
    firstParts.push(parts[1].trim());

    return firstParts;
  }

  public static getSystemPromptSync(): string {
    return fs.readFileSync(
      `${process.cwd()}/data/domain/${config.THAUMATURGY.DOMAIN}/${config.IMPORTER.FILE_SYSTEM_PROMPT}`,
      "utf8",
    );
  }

  public static setSystemPromptSync(prompt: string) {
    fs.writeFileSync(
      path.join(
        process.cwd(),
        "data",
        "domain",
        config.THAUMATURGY.DOMAIN,
        config.IMPORTER.FILE_SYSTEM_PROMPT,
      ),
      prompt,
      "utf8",
    );
  }

  public static getMemGPTLLMConfig(): LLMConfig {
    try {
      const filePath = path.resolve(config.MEMGPT.MOD.MEMGPT_CONFIG_PATH);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const llm_config = ini.parse(fileContent);

      // Extract the relevant data from the [model] section
      const {
        model_endpoint_type,
        model_endpoint,
        model_wrapper,
        context_window,
      } = llm_config.model;

      return {
        model: null,
        model_endpoint_type,
        model_endpoint,
        model_wrapper,
        context_window: parseInt(context_window),
      };
    } catch (error) {
      console.error("Error reading or parsing config file:", error);
      throw error;
    }
  }

  public static updateMemGPTLLMConfig(newConfig: LLMConfig) {
    try {
      const filePath = path.resolve(config.MEMGPT.MOD.MEMGPT_CONFIG_PATH);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const llm_config = ini.parse(fileContent);

      // Update only the fields that are passed in
      if (newConfig.model_endpoint_type !== undefined) {
        llm_config.model.model_endpoint_type = newConfig.model_endpoint_type;
      }
      if (newConfig.model_endpoint !== undefined) {
        llm_config.model.model_endpoint = newConfig.model_endpoint;
      }
      if (newConfig.model_wrapper !== undefined) {
        llm_config.model.model_wrapper = newConfig.model_wrapper;
      }
      if (
        newConfig.context_window !== undefined &&
        newConfig.context_window != null
      ) {
        llm_config.model.context_window = newConfig.context_window.toString();
      }

      // Serialize the updated config back to INI format
      const updatedFileContent = ini.stringify(llm_config);

      // Write the updated content back to the INI file
      fs.writeFileSync(filePath, updatedFileContent, "utf-8");
    } catch (error) {
      console.error("Error updating config file:", error);
      throw error;
    }
  }

  public static convertFunctionListToSchema(
    functionList: string,
  ): Array<config.FunctionSchema> {
    const functionArray = functionList.split(",").map((func) => func.trim());

    const schema = functionArray.map((func) => ({
      name: func,
    }));

    return schema;
  }

  public static routerLevelExceptionHandler(e: Error, res: Response) {
    console.log(e);
    if (e instanceof HttpException) {
      res.status(e.statusCode).json({ error: e.message });
    } else {
      res
        .status(HttpStatusCode.InternalServerError)
        .json({ data: { error: e.message } });
    }
  }
}
