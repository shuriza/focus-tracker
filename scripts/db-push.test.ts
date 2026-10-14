import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { discoverMigrations, readEnvFile } from "./db-push.mjs";

const tempDirs: string[] = [];

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "db-push-"));
  tempDirs.push(dir);
  return dir;
}

after(() => {
  tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

describe("readEnvFile", () => {
  it("mengisi variabel yang belum ada", () => {
    const dir = makeTempDir();
    const file = join(dir, ".env");
    writeFileSync(file, "MIGRATION_TEST_A=alpha\nMIGRATION_TEST_B=beta\n");

    delete process.env.MIGRATION_TEST_A;
    delete process.env.MIGRATION_TEST_B;
    readEnvFile(file);

    assert.equal(process.env.MIGRATION_TEST_A, "alpha");
    assert.equal(process.env.MIGRATION_TEST_B, "beta");
  });

  it("melewati komentar, baris kosong, dan baris tanpa =", () => {
    const dir = makeTempDir();
    const file = join(dir, ".env");
    writeFileSync(file, "# komentar\n\nMIGRATION_TEST_C=city\ntanpa-sama-dengan\n");

    delete process.env.MIGRATION_TEST_C;
    readEnvFile(file);

    assert.equal(process.env.MIGRATION_TEST_C, "city");
  });

  it("mengupas tanda kutip di sekeliling nilai", () => {
    const dir = makeTempDir();
    const file = join(dir, ".env");
    writeFileSync(
      file,
      'MIGRATION_TEST_D="kutip ganda"\nMIGRATION_TEST_E=\'kutip tunggal\'\n',
    );

    delete process.env.MIGRATION_TEST_D;
    delete process.env.MIGRATION_TEST_E;
    readEnvFile(file);

    assert.equal(process.env.MIGRATION_TEST_D, "kutip ganda");
    assert.equal(process.env.MIGRATION_TEST_E, "kutip tunggal");
  });

  it("tidak menimpa nilai yang sudah diset", () => {
    const dir = makeTempDir();
    const file = join(dir, ".env");
    writeFileSync(file, "MIGRATION_TEST_F=dari-file\n");

    process.env.MIGRATION_TEST_F = "dari-caller";
    readEnvFile(file);

    assert.equal(process.env.MIGRATION_TEST_F, "dari-caller");
  });

  it("diam saja kalau file tidak ada", () => {
    assert.doesNotThrow(() => readEnvFile(join(makeTempDir(), "nope.env")));
  });
});

describe("discoverMigrations", () => {
  it("mengembalikan file .sql terurut, dan mengabaikan selain .sql", () => {
    const root = makeTempDir();
    const migrationsDir = join(root, "database", "migrations");
    mkdirSync(migrationsDir, { recursive: true });

    ["20260102_b.sql", "20260101_a.sql", "README.md", "20260103_c.sql"].forEach(
      (name) => writeFileSync(join(migrationsDir, name), "SELECT 1;"),
    );

    const found = discoverMigrations(migrationsDir);
    const names = found.map((m) => m.name);

    assert.deepEqual(names, [
      "20260101_a.sql",
      "20260102_b.sql",
      "20260103_c.sql",
    ]);
    assert.ok(found.every((m) => m.version === m.name.replace(/\.sql$/, "")));
    assert.ok(found.every((m) => m.size > 0));
  });
});
