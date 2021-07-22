const { expect } = require("chai");

describe("version", function () {
  it("should match the version from package.json", function () {
    const packageVersion = require("../package.json").version;
    expect(require("../lib/version")).to.equal(packageVersion);
  });
});
