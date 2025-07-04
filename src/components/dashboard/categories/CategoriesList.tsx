
"use client";

import { useState } from "react";
import { useUserCategories } from "@/hooks/useUserCategories";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicIcon from "@/components/DynamicIcon";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditCategoryDialog } from "./EditCategoryDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import { AddCategoryDialog } from "./AddCategoryDialog";
import type { Category } from "@/types";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function CategoriesList() {
  const { categories, loading } = useUserCategories();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);


  const handleDelete = async () => {
    if (!deletingCategory || !user) return;

    try {
      // Start by deleting the category document itself.
      await deleteDoc(doc(db, "categories", deletingCategory.id));
      
      // Then, update all transactions that used this category.
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        where("category", "==", deletingCategory.name)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach(doc => {
        batch.update(doc.ref, { category: "altro" });
      });
      await batch.commit();

      toast({
        title: "Successo!",
        description: `Categoria "${deletingCategory.name}" eliminata. Le transazioni associate sono state spostate in "altro".`,
      });
    } catch (error) {
        console.error("Error deleting category:", error);
        toast({
            variant: "destructive",
            title: "Errore",
            description: "Impossibile eliminare la categoria."
        });
    } finally {
        setDeletingCategory(null);
    }
  };

  const renderTable = (type: "expense" | "income") => {
    const filteredCategories = categories.filter((c) => c.type === type || c.type === 'general');

    if (loading) {
      return (
        <div className="space-y-2 p-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }
    
    return (
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Icona</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div 
                      className="flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground"
                      style={{ backgroundColor: cat.color || '#444444' }}
                    >
                      <DynamicIcon name={cat.icon} className="h-5 w-5" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <span>{cat.name}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCategory(cat)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifica
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingCategory(cat)}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nessuna categoria di {type === 'expense' ? 'spesa' : 'entrata'}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestione Categorie</h1>
            <p className="text-muted-foreground">
                Crea, modifica ed elimina le tue categorie di spesa e entrata.
            </p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Aggiungi Categoria
            </Button>
        </div>
        <Tabs defaultValue="expense" className="w-full" onValueChange={(value) => setActiveTab(value as 'expense' | 'income')}>
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                <ArrowDownCircle className="mr-2 h-4 w-4" />
                Spese
                </TabsTrigger>
            <TabsTrigger value="income" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Entrate
                </TabsTrigger>
            </TabsList>
            <Card className="mt-4">
                <TabsContent value="expense" className="m-0">
                {renderTable("expense")}
                </TabsContent>
                <TabsContent value="income" className="m-0">
                {renderTable("income")}
                </TabsContent>
            </Card>
        </Tabs>
      </div>

      <AddCategoryDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        initialType={activeTab}
        existingCategories={categories.map(c => c.name)}
      />

      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(isOpen) => !isOpen && setEditingCategory(null)}
          existingCategories={categories.map(c => c.name)}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          open={!!deletingCategory}
          onOpenChange={(isOpen) => !isOpen && setDeletingCategory(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
