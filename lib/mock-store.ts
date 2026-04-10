export type MockUser = {
  _id: string;
  email: string;
  password?: string;
  name: string;
  role: "user" | "associate" | "vendor" | "buyer" | "admin" | "superadmin";
  isVerified: boolean;
  isActive: boolean;
  subscription: {
    plan: "free" | "pro" | "enterprise";
    status: "active" | "canceled" | "expired";
    startDate: Date;
    endDate?: Date;
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type MockUsageRow = {
  key: string;
  freeUsed: number;
  paid: boolean;
};

type MockStore = {
  users: Map<string, MockUser>;
  sessions: Map<string, string>;
  usage: Map<string, MockUsageRow>;
};

declare global {
  // eslint-disable-next-line no-var
  var __vitruviMockStore: MockStore | undefined;
}

function createStore(): MockStore {
  return {
    users: new Map(),
    sessions: new Map(),
    usage: new Map()
  };
}

export function getMockStore() {
  const store = global.__vitruviMockStore ?? createStore();
  global.__vitruviMockStore = store;
  return store;
}
