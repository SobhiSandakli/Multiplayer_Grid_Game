// import { BroadcastOperator, Server } from 'socket.io';
// import { mock } from 'jest-mock-extended';

// export const createMockBroadcastOperator = () => {
//   return mock<BroadcastOperator<EmitEvents, SocketData>>();
// };

// export const createMockServer = () => {
//   const mockBroadcastOperator = createMockBroadcastOperator();
//   const mockServer = mock<Server>();
//   mockServer.to.mockReturnValue(mockBroadcastOperator);
//   return { mockServer, mockBroadcastOperator };
// };

// export interface EmitEvents {
//   // Define your emit events here
// }

// export interface SocketData {
//   // Define your socket data here
// }
