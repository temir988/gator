import { describe, test, expect } from "bun:test";

describe("Basic CLI", () => {
  test("should reset db", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "reset"]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should register a user", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "register", "kahya"]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should addfeed Hacker News RSS", async () => {
    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "addfeed",
      "Hacker News RSS",
      "https://hnrss.org/newest",
    ]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should register another user", async () => {
    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "register",
      "holgith",
    ]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should addfeed Lanes Blog RSS", async () => {
    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "addfeed",
      "Lanes Blog",
      "https://www.wagslane.dev/index.xml",
    ]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should follow to existing Hacker news RSS", async () => {
    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "follow",
      "https://hnrss.org/newest",
    ]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should have two follows", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "following"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Hacker News RSS");
    expect(stdout).toContain("Lanes Blog");
  });

  test("should login first user", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "login", "kahya"]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should have two follows", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "following"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Hacker News RSS");
    expect(stdout).not.toContain("Lanes Blog");
  });
});

describe("Unfollow flow", () => {
  test("should reset db", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "reset"]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should register a user", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "register", "kahya"]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should addfeed Hacker News RSS", async () => {
    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "addfeed",
      "Hacker News RSS",
      "https://hnrss.org/newest",
    ]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should have Hacker News RSS", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "following"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Hacker News RSS");
  });

  test("should unfollow Hacker News RSS", async () => {
    const proc = Bun.spawn([
      "bun",
      "run",
      "src/index.ts",
      "unfollow",
      "https://hnrss.org/newest",
    ]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test("should not have Hacker News RSS", async () => {
    const proc = Bun.spawn(["bun", "run", "src/index.ts", "following"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();

    expect(exitCode).toBe(0);
    expect(stdout).not.toContain("Hacker News RSS");
  });
});
