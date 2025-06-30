
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
  createdAt: Timestamp;
  iconUrl?: string;
  color?: string;
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
  userId: string;
  name: string;
  type: "income" | "expense" | "general";
  icon: string;
  color?: string;
  createdAt: Timestamp;
};

export type UserProfile = {
  uid: string;
  email: string | null;
  role: "user" | "admin";
};
