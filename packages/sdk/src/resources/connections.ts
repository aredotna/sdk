import {
  createConnection,
  deleteConnection,
  getConnection,
  moveConnection,
  updateConnection,
} from "../generated/sdk.gen";
import type {
  CreateConnectionData,
  MoveConnectionData,
  UpdateConnectionData,
} from "../generated/types.gen";
import { data, type RequestOverrides, type ResourceContext, withClient } from "./shared";

export type CreateConnectionInput = CreateConnectionData["body"];
export type UpdateConnectionInput = UpdateConnectionData["body"];
export type MoveConnectionInput = MoveConnectionData["body"];

export const createConnectionsResource = ({ client }: ResourceContext) => ({
  get: (id: number, options?: RequestOverrides) =>
    data(getConnection(withClient(client, { path: { id } }, options))),

  create: (body: CreateConnectionInput, options?: RequestOverrides) =>
    data(createConnection(withClient(client, { body }, options))),

  update: (id: number, body: UpdateConnectionInput, options?: RequestOverrides) =>
    data(updateConnection(withClient(client, { body, path: { id } }, options))),

  move: (id: number, body: MoveConnectionInput, options?: RequestOverrides) =>
    data(moveConnection(withClient(client, { body, path: { id } }, options))),

  delete: (id: number, options?: RequestOverrides) =>
    data(deleteConnection(withClient(client, { path: { id } }, options))),
});

export type ConnectionsResource = ReturnType<typeof createConnectionsResource>;
