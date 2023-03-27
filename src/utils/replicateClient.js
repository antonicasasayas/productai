import Replicate from "replicate";

export const replicate = new Replicate({
  // get your token from https://replicate.com/account
  auth: process.env.REPLICATE_API_TOKEN,
  userAgent: "productai/1.0.0",
});