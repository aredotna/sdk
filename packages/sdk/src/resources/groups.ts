import {
  createGroup,
  createGroupInvitation,
  createGroupInvite,
  deleteGroup,
  deleteGroupInvite,
  getGroup,
  getGroupContents,
  getGroupFollowers,
  getGroupInvitations,
  getGroupInvite,
  getGroupMembers,
  joinGroup,
  leaveGroup,
  removeGroupMember,
  revokeGroupInvitation,
  updateGroup,
} from "../generated/sdk.gen";
import type {
  CreateGroupData,
  CreateGroupInvitationData,
  GetGroupContentsData,
  GetGroupFollowersData,
  GetGroupInvitationsData,
  GetGroupMembersData,
  JoinGroupData,
  UpdateGroupData,
} from "../generated/types.gen";
import { paginate } from "../pagination";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export type GroupId = string | number;
export type CreateGroupInput = CreateGroupData["body"];
export type UpdateGroupInput = UpdateGroupData["body"];
export type JoinGroupInput = JoinGroupData["body"];
export type GroupInviteInput = CreateGroupInvitationData["body"];
export type GroupContentsOptions = NonNullable<GetGroupContentsData["query"]>;
export type GroupFollowersOptions = NonNullable<GetGroupFollowersData["query"]>;
export type GroupMembersOptions = NonNullable<GetGroupMembersData["query"]>;
export type GroupInvitationsOptions = NonNullable<GetGroupInvitationsData["query"]>;

export const createGroupsResource = ({ client }: ResourceContext) => ({
  get: (id: GroupId, options?: RequestOverrides) =>
    data(getGroup(withClient(client, { path: { id: String(id) } }, options))),

  create: (body: CreateGroupInput, options?: RequestOverrides) =>
    data(createGroup(withClient(client, { body }, options))),

  update: (id: GroupId, body: UpdateGroupInput, options?: RequestOverrides) =>
    data(updateGroup(withClient(client, { body, path: { id: String(id) } }, options))),

  delete: (id: GroupId, options?: RequestOverrides) =>
    data(deleteGroup(withClient(client, { path: { id: String(id) } }, options))),

  contents: (id: GroupId, query?: GroupContentsOptions, options?: RequestOverrides) =>
    data(getGroupContents(withClient(client, { path: { id: String(id) }, query }, options))),

  paginateContents: (id: GroupId, query?: GroupContentsOptions, options?: RequestOverrides) =>
    paginate((params) => data(getGroupContents(withClient(client, params, options))), {
      path: { id: String(id) },
      query,
    }),

  followers: (id: GroupId, query?: GroupFollowersOptions, options?: RequestOverrides) =>
    data(getGroupFollowers(withClient(client, { path: { id: String(id) }, query }, options))),

  members: (id: GroupId, query?: GroupMembersOptions, options?: RequestOverrides) =>
    data(getGroupMembers(withClient(client, { path: { id: String(id) }, query }, options))),

  paginateMembers: (id: GroupId, query?: GroupMembersOptions, options?: RequestOverrides) =>
    paginate((params) => data(getGroupMembers(withClient(client, params, options))), {
      path: { id: String(id) },
      query,
    }),

  join: (id: GroupId, body?: JoinGroupInput, options?: RequestOverrides) =>
    data(joinGroup(withClient(client, { body: body ?? {}, path: { id: String(id) } }, options))),

  leave: (id: GroupId, options?: RequestOverrides) =>
    data(leaveGroup(withClient(client, { path: { id: String(id) } }, options))),

  removeMember: (id: GroupId, userId: number, options?: RequestOverrides) =>
    data(
      removeGroupMember(withClient(client, { path: { id: String(id), user_id: userId } }, options)),
    ),

  invitations: (id: GroupId, query?: GroupInvitationsOptions, options?: RequestOverrides) =>
    data(getGroupInvitations(withClient(client, { path: { id: String(id) }, query }, options))),

  paginateInvitations: (id: GroupId, query?: GroupInvitationsOptions, options?: RequestOverrides) =>
    paginate((params) => data(getGroupInvitations(withClient(client, params, options))), {
      path: { id: String(id) },
      query,
    }),

  invite: (id: GroupId, body: GroupInviteInput, options?: RequestOverrides) =>
    data(createGroupInvitation(withClient(client, { body, path: { id: String(id) } }, options))),

  revokeInvitation: (id: GroupId, invitationId: number, options?: RequestOverrides) =>
    data(
      revokeGroupInvitation(
        withClient(client, { path: { id: String(id), invitation_id: invitationId } }, options),
      ),
    ),

  inviteCode: (id: GroupId, options?: RequestOverrides) =>
    data(getGroupInvite(withClient(client, { path: { id: String(id) } }, options))),

  createInviteCode: (id: GroupId, options?: RequestOverrides) =>
    data(createGroupInvite(withClient(client, { path: { id: String(id) } }, options))),

  deleteInviteCode: (id: GroupId, options?: RequestOverrides) =>
    data(deleteGroupInvite(withClient(client, { path: { id: String(id) } }, options))),
});

export type GroupsResource = ReturnType<typeof createGroupsResource>;
