//app/(admin)/admin/media/_components/folder-modal.tsx

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFolder, renameFolder } from "@/app/actions/admin/media/folder-actions";
import { toast } from "react-hot-toast";
import { Loader2, FolderPlus, Edit3 } from "lucide-react";

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "CREATE" | "RENAME";
  parentFolderId?: string | null; // For Create
  folderToEdit?: { id: string; name: string } | null; // For Rename
}

export function FolderModal({ isOpen, onClose, onSuccess, mode, parentFolderId, folderToEdit }: FolderModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset or Set Initial Value
  useEffect(() => {
    if (isOpen) {
        setName(mode === "RENAME" && folderToEdit ? folderToEdit.name : "");
    }
  }, [isOpen, mode, folderToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Folder name is required");

    setLoading(true);
    let res;

    if (mode === "CREATE") {
        res = await createFolder(name, parentFolderId);
    } else {
        if (folderToEdit) {
            res = await renameFolder(folderToEdit.id, name);
        }
    }

    setLoading(false);

    if (res?.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
    } else {
        toast.error(res?.message || "Operation failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            {mode === "CREATE" ? <FolderPlus size={20} className="text-indigo-600"/> : <Edit3 size={20} className="text-orange-500"/>}
            {mode === "CREATE" ? "Create New Folder" : "Rename Folder"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input 
                id="folderName" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Products, Banners..."
                autoFocus
                className="focus-visible:ring-indigo-500"
            />
            {mode === "CREATE" && parentFolderId && (
                <p className="text-[11px] text-slate-400">Creating inside selected parent folder.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={loading}
                className={mode === "CREATE" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-orange-500 hover:bg-orange-600"}
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={16}/> : null}
              {mode === "CREATE" ? "Create Folder" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}