import { describe, expect, it } from "vitest";
import * as api from "../src/api";

const expectedOperations = [
  "batchCreateBlocks",
  "createBlock",
  "createBlockComment",
  "createChannel",
  "createConnection",
  "createOAuthToken",
  "deleteChannel",
  "deleteComment",
  "deleteConnection",
  "getBatchStatus",
  "getBlock",
  "getBlockComments",
  "getBlockConnections",
  "getChannel",
  "getChannelConnections",
  "getChannelContents",
  "getChannelFollowers",
  "getConnection",
  "getCurrentUser",
  "getGroup",
  "getGroupContents",
  "getGroupFollowers",
  "getOpenapiSpec",
  "getOpenapiSpecJson",
  "getPing",
  "getUser",
  "getUserContents",
  "getUserFollowers",
  "getUserFollowing",
  "getUserGroups",
  "moveConnection",
  "presignUpload",
  "search",
  "updateBlock",
  "updateChannel",
  "updateConnection",
];

describe("@aredotna/sdk/api operation exports", () => {
  it("keeps generated operation names intentional", () => {
    const operationExports = Object.entries(api)
      .filter(([name, value]) => name !== "createClient" && typeof value === "function")
      .map(([name]) => name)
      .sort();

    expect(operationExports).toEqual(expectedOperations);
  });
});
