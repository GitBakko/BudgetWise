import type { Timestamp } from "firebase/firestore";

export type Transaction = {
  id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: Timestamp;
  category: string;
  createdAt: Timestamp;
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
