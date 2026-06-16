import { describe, expect, it } from "vitest";
import * as api from "../src/api";

const expectedOperations = [
  "batchCreateBlocks",
  "createBlock",
  "createBlockComment",
  "createChannel",
  "createConnection",
  "createGroup",
  "createGroupInvitation",
  "createGroupInvite",
  "createOAuthToken",
  "deleteChannel",
  "deleteComment",
  "deleteConnection",
  "deleteGroup",
  "deleteGroupInvite",
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
  "getGroupInvitations",
  "getGroupInvite",
  "getGroupMembers",
  "getMyFeed",
  "getMyNotifications",
  "getOpenapiSpec",
  "getOpenapiSpecJson",
  "getPing",
  "getUser",
  "getUserContents",
  "getUserFollowers",
  "getUserFollowing",
  "getUserGroups",
  "joinGroup",
  "leaveGroup",
  "markAllMyNotificationsRead",
  "markMyNotificationRead",
  "moveConnection",
  "presignUpload",
  "removeGroupMember",
  "revokeGroupInvitation",
  "search",
  "updateBlock",
  "updateChannel",
  "updateConnection",
  "updateGroup",
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
