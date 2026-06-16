import type { Group } from "@aredotna/sdk";
import type {
  CreateGroupData,
  CreateGroupInvitationData,
  CreateGroupInvitationResponse,
  CreateGroupInviteResponse,
  DeleteGroupInviteResponse,
  DeleteGroupResponse,
  JoinGroupData,
  JoinGroupResponse,
  LeaveGroupResponse,
  RemoveGroupMemberResponse,
  RevokeGroupInvitationResponse,
  UpdateGroupData,
} from "@aredotna/sdk/api";
import { useArena } from "../use-arena";
import { type ArenaMutationOptions, useArenaMutation } from "./shared";

type GroupId = string | number;
type CreateGroupInput = CreateGroupData["body"];
type UpdateGroupVariables = {
  body: UpdateGroupData["body"];
  id: GroupId;
};
type DeleteGroupVariables = {
  id: GroupId;
};
type JoinGroupVariables = {
  body?: JoinGroupData["body"];
  id: GroupId;
};
type LeaveGroupVariables = {
  id: GroupId;
};
type RemoveGroupMemberVariables = {
  id: GroupId;
  userId: number;
};
type InviteToGroupVariables = {
  body: CreateGroupInvitationData["body"];
  id: GroupId;
};
type RevokeGroupInvitationVariables = {
  id: GroupId;
  invitationId: number;
};
type CreateGroupInviteVariables = {
  id: GroupId;
};
type DeleteGroupInviteVariables = {
  id: GroupId;
};

export type UseCreateGroupOptions = ArenaMutationOptions<Group, CreateGroupInput>;
export type UseUpdateGroupOptions = ArenaMutationOptions<Group, UpdateGroupVariables>;
export type UseDeleteGroupOptions = ArenaMutationOptions<DeleteGroupResponse, DeleteGroupVariables>;
export type UseJoinGroupOptions = ArenaMutationOptions<JoinGroupResponse, JoinGroupVariables>;
export type UseLeaveGroupOptions = ArenaMutationOptions<LeaveGroupResponse, LeaveGroupVariables>;
export type UseRemoveGroupMemberOptions = ArenaMutationOptions<
  RemoveGroupMemberResponse,
  RemoveGroupMemberVariables
>;
export type UseInviteToGroupOptions = ArenaMutationOptions<
  CreateGroupInvitationResponse,
  InviteToGroupVariables
>;
export type UseRevokeGroupInvitationOptions = ArenaMutationOptions<
  RevokeGroupInvitationResponse,
  RevokeGroupInvitationVariables
>;
export type UseCreateGroupInviteOptions = ArenaMutationOptions<
  CreateGroupInviteResponse,
  CreateGroupInviteVariables
>;
export type UseDeleteGroupInviteOptions = ArenaMutationOptions<
  DeleteGroupInviteResponse,
  DeleteGroupInviteVariables
>;

export const useCreateGroup = (options?: UseCreateGroupOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: (input) => arena.groups.create(input),
  } satisfies {
    mutationFn: (input: CreateGroupInput) => Promise<Group>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useUpdateGroup = (options?: UseUpdateGroupOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ body, id }) => arena.groups.update(id, body),
  } satisfies {
    mutationFn: (variables: UpdateGroupVariables) => Promise<Group>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useDeleteGroup = (options?: UseDeleteGroupOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ id }) => arena.groups.delete(id),
  } satisfies {
    mutationFn: (variables: DeleteGroupVariables) => Promise<DeleteGroupResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useJoinGroup = (options?: UseJoinGroupOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ body, id }) => arena.groups.join(id, body),
  } satisfies {
    mutationFn: (variables: JoinGroupVariables) => Promise<JoinGroupResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useLeaveGroup = (options?: UseLeaveGroupOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ id }) => arena.groups.leave(id),
  } satisfies {
    mutationFn: (variables: LeaveGroupVariables) => Promise<LeaveGroupResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useRemoveGroupMember = (options?: UseRemoveGroupMemberOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ id, userId }) => arena.groups.removeMember(id, userId),
  } satisfies {
    mutationFn: (variables: RemoveGroupMemberVariables) => Promise<RemoveGroupMemberResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useInviteToGroup = (options?: UseInviteToGroupOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ body, id }) => arena.groups.invite(id, body),
  } satisfies {
    mutationFn: (variables: InviteToGroupVariables) => Promise<CreateGroupInvitationResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useRevokeGroupInvitation = (options?: UseRevokeGroupInvitationOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ id, invitationId }) => arena.groups.revokeInvitation(id, invitationId),
  } satisfies {
    mutationFn: (
      variables: RevokeGroupInvitationVariables,
    ) => Promise<RevokeGroupInvitationResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useCreateGroupInvite = (options?: UseCreateGroupInviteOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ id }) => arena.groups.createInviteCode(id),
  } satisfies {
    mutationFn: (variables: CreateGroupInviteVariables) => Promise<CreateGroupInviteResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};

export const useDeleteGroupInvite = (options?: UseDeleteGroupInviteOptions) => {
  const arena = useArena();

  const mutation = {
    mutationFn: ({ id }) => arena.groups.deleteInviteCode(id),
  } satisfies {
    mutationFn: (variables: DeleteGroupInviteVariables) => Promise<DeleteGroupInviteResponse>;
  };

  return useArenaMutation(options ? { ...mutation, options } : mutation);
};
