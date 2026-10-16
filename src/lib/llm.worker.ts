import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Runs the on-device model in a Web Worker so the interface stays responsive while it thinks.
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (message: MessageEvent) => handler.onmessage(message);
