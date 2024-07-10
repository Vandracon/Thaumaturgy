import axios from "axios";
import { IOpenAIProtocolLLMProvider } from "../core/interfaces/IOpenAIProtocolLLMProvider";
import { Validator } from "../core/validators/Validator";
import { OpenAIProtocolTransport } from "./OpenAIProtocolTransport";
import { Response } from "express";

const config = require("config");

export class OpenAIProtocolLLMProvider implements IOpenAIProtocolLLMProvider {
  async handleMessage(res: Response, originalBody: string) {
    const url = config.LLM_ENDPOINT;
    const headers = {
      //'Authorization': `Bearer YOUR_OPEN_AI_KEY`,
      "Content-Type": "application/json",
    };

    let orig = JSON.parse(originalBody);
    orig.stream = false;
    orig.messages = Validator.removeEmptyContent(orig.messages);

    console.log("Sending original incoming msg to fallback LLM");
    const response = await axios.post(url, orig, { headers: headers });

    console.log("\n\nLLM Response", JSON.stringify(response.data));

    orig = JSON.parse(originalBody);

    if (orig.stream) {
      await OpenAIProtocolTransport.streamToClient(res, response.data);
      res.end();
    } else {
      res.json(response.data);
    }
  }
}
