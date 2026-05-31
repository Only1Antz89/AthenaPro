import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { AppError, toDisplayError } from "@/lib/errors";

describe("toDisplayError", () => {
  it("returns app error messages directly", () => {
    expect(toDisplayError(new AppError("Profile insert failed.", "PROFILE_CREATE_FAILED"))).toBe(
      "Profile insert failed."
    );
  });

  it("returns standard error messages directly", () => {
    expect(toDisplayError(new Error("Select at least one discipline."))).toBe(
      "Select at least one discipline."
    );
  });

  it("formats zod validation errors into readable field messages", () => {
    const error = new ZodError([
      {
        code: "too_small",
        minimum: 7,
        type: "string",
        inclusive: true,
        exact: false,
        message: "String must contain at least 7 character(s)",
        path: ["phone"]
      },
      {
        code: "too_small",
        minimum: 2,
        type: "string",
        inclusive: true,
        exact: false,
        message: "String must contain at least 2 character(s)",
        path: ["location"]
      }
    ]);

    expect(toDisplayError(error)).toBe(
      "Phone: String must contain at least 7 character(s)\nLocation: String must contain at least 2 character(s)"
    );
  });

  it("falls back to a generic message for unknown error shapes", () => {
    expect(toDisplayError({ message: "Hidden" })).toBe("Something went wrong. Please try again.");
  });
});
