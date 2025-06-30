import type { Timestamp } from "firebase/firestore";

export type Transaction = {
  id: string;
  userId: string;
  accountId: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: Timestamp;
  category: string;
  createdAt: Timestamp;
};

export type Account = {
  id: string;
  userId: string;
  name: string;
  initialBalance: number;
  createdAt: Timestamp;
  iconUrl?: string;
};

export type BalanceSnapshot = {
  id: string;
  userId: string;
  accountId: string;
  date: Timestamp;
  balance: number;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  createdBy?: "system" | string; // 'system' or userId
};

export type UserProfile = {
  uid: string;
  email: string | null;
  role: "user" | "admin";
};
