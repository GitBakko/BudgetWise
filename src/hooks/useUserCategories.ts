
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Category } from "@/types";

export function useUserCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        const q = query(
            collection(db, "categories"), 
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats: Category[] = [];
            snapshot.forEach((doc) => cats.push({ id: doc.id, ...doc.data() } as Category));
            
            cats.sort((a, b) => {
                if (a.type < b.type) return -1;
                if (a.type > b.type) return 1;
                return a.name.localeCompare(b.name);
            });
            
            setCategories(cats);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching categories: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { categories, loading };
}
