import { describe, expect, it } from "vitest";
import axios from "axios";

describe("RapidAPI JSearch Key Validation", () => {
  it("should successfully call JSearch API with the provided key", async () => {
    const apiKey = process.env.RAPIDAPI_KEY;
    expect(apiKey).toBeTruthy();

    const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query: "developer in Singapore",
        page: 1,
        num_pages: 1,
      },
      headers: {
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        "X-RapidAPI-Key": apiKey!,
      },
      timeout: 15000,
    });

    expect(response.status).toBe(200);
    expect(response.data.status).toBe("OK");
    expect(response.data.data).toBeDefined();
    expect(Array.isArray(response.data.data)).toBe(true);
  }, 20000);
});
