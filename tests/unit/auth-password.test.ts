import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD } from "@/lib/mock/seed";

describe("auth password hashing", () => {
  it("hashes and verifies the demo password with bcrypt", async () => {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    expect(hash).not.toBe(DEMO_PASSWORD);
    await expect(bcrypt.compare(DEMO_PASSWORD, hash)).resolves.toBe(true);
    await expect(bcrypt.compare("wrong", hash)).resolves.toBe(false);
  });
});
